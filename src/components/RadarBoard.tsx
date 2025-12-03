import type { FC, RefObject } from "react";
import { useRef, useEffect, useState } from "react";
import styles from "../App.module.css";
import type { PositionedNode } from "../types";
import type { HoldingNode } from "../data/holdings";
import {
  distributeContentInCircle,
  type DistributedItem,
} from "../utils/distributeContentInCircle";
import { warmSet } from "../data/warmContacts";

// локальный тип уровня зума (2 или 3)
type ZoomLevel = 2 | 3;

type RadarBoardProps = {
  nodes: PositionedNode[];
  diameter: number;
  onSelect: (holding: HoldingNode | null) => void;
  holdingsPool: HoldingNode[];
  boardRef: RefObject<HTMLDivElement | null>;
  selectedId?: string | null;
  resetZoomTrigger?: number;
  zoomInTrigger?: number;
  zoomOutTrigger?: number;
  activeFilter?: string;
};

export const RadarBoard: FC<RadarBoardProps> = ({
  nodes,
  diameter,
  onSelect,
  holdingsPool,
  boardRef,
  selectedId,
  activeFilter,
  resetZoomTrigger,
  zoomInTrigger,
  zoomOutTrigger,
}) => {
  // локальное состояние трансформации (tx, ty, scale)
  const [transform, setTransform] = useState({ tx: 0, ty: 0, s: 1 });

  // Сброс трансформации при изменении внешнего триггера
  useEffect(() => {
    if (typeof resetZoomTrigger === "number") {
      setTransform({ tx: 0, ty: 0, s: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetZoomTrigger]);

  // Фиксированные уровни зума: базовый diameter (prop), 380 и 598 (как по ТЗ)
  const BASE_DIAMETER = diameter; // 205
  const ZOOM_DIAMETER_1 = 380;
  const ZOOM_DIAMETER_2 = 598;

  const SCALE_1 = ZOOM_DIAMETER_1 / BASE_DIAMETER;
  const SCALE_2 = ZOOM_DIAMETER_2 / BASE_DIAMETER;

  // zoom in: 1 -> SCALE_1 -> SCALE_2 (stop at SCALE_2)
  useEffect(() => {
    if (typeof zoomInTrigger === "number") {
      setTransform((prev) => {
        const EPS = 0.0001;
        // determine target scale step
        let target = prev.s;
        if (Math.abs(prev.s - 1) < EPS) target = SCALE_1;
        else if (Math.abs(prev.s - SCALE_1) < EPS) target = SCALE_2;
        else target = prev.s;

        if (target === prev.s) return prev;

        try {
          const board = boardRef?.current;
          if (board && nodes && nodes.length) {
            const wrapper = (board.parentElement as HTMLElement) || board;
            const wrapperRect = wrapper.getBoundingClientRect();

            // content center in content coordinates (what is under screen center)
            const centerScreenX = wrapperRect.width / 2;
            const centerScreenY = wrapperRect.height / 2;
            const contentCenterX = (centerScreenX - prev.tx) / prev.s;
            const contentCenterY = (centerScreenY - prev.ty) / prev.s;

            // prefer the node nearest to the current center (user may have panned)
            let best: PositionedNode | null = null;
            let bestDist = Infinity;
            for (const n of nodes) {
              const dx = n.cx - contentCenterX;
              const dy = n.cy - contentCenterY;
              const d = Math.hypot(dx, dy);
              if (d < bestDist) {
                bestDist = d;
                best = n;
              }
            }

            // if no good candidate found, fallback to selectedId
            let nodeToCenter: PositionedNode | undefined = undefined;
            if (
              best &&
              bestDist < Math.max(wrapperRect.width, wrapperRect.height) * 0.5
            ) {
              nodeToCenter = best;
            } else if (selectedId) {
              nodeToCenter = nodes.find((n) => n.id === selectedId);
            }

            if (nodeToCenter) {
              const tx = wrapperRect.width / 2 - nodeToCenter.cx * target;
              const ty = wrapperRect.height / 2 - nodeToCenter.cy * target;
              return { tx: tx, ty, s: target };
            }
          }
        } catch (e) {
          // fallback
        }

        // fallback: just change scale keeping current tx/ty (so view doesn't jump)
        return { ...prev, s: target };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomInTrigger]);

  // Обработчик колесика мыши: масштабируем по курсору (интуитивный зум)
  useEffect(() => {
    const boardEl = boardRef?.current;
    if (!boardEl) return undefined;

    const onWheel = (e: WheelEvent) => {
      // когда колесико над доской — предотвращаем скролл страницы
      e.preventDefault();

      const rect = boardEl.getBoundingClientRect();
      const cursorX = e.clientX - rect.left; // координаты внутри wrapper
      const cursorY = e.clientY - rect.top;

      const delta = -e.deltaY; // обычно положительное при прокрутке вверх (зум in)
      // чувствительность — настроена эмпирически
      const zoomFactor = Math.exp(delta * 0.0015);

      setTransform((prev) => {
        const s0 = prev.s;
        let s1 = s0 * zoomFactor;
        if (s1 < 1) s1 = 1;
        if (s1 > SCALE_2) s1 = SCALE_2;
        if (Math.abs(s1 - s0) < 1e-4) return prev;

        // координаты содержимого, которые сейчас под курсором
        const contentX = (cursorX - prev.tx) / s0;
        const contentY = (cursorY - prev.ty) / s0;

        // новый сдвиг так, чтобы тот же контентный пиксель остался под курсором
        const tx = cursorX - contentX * s1;
        const ty = cursorY - contentY * s1;

        return { tx, ty, s: s1 };
      });
    };

    // boardEl.addEventListener("wheel", onWheel, { passive: false });
    return () => boardEl.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardRef, SCALE_2]);

  // zoom out: SCALE_2 -> SCALE_1 -> 1
  useEffect(() => {
    if (typeof zoomOutTrigger === "number") {
      setTransform((prev) => {
        const EPS = 0.0001;
        if (Math.abs(prev.s - SCALE_2) < EPS) {
          try {
            const board = boardRef?.current;
            if (board && nodes && nodes.length) {
              const wrapper = (board.parentElement as HTMLElement) || board;
              const wrapperRect = wrapper.getBoundingClientRect();

              // центр экрана в координатах контента
              const centerScreenX = wrapperRect.width / 2;
              const centerScreenY = wrapperRect.height / 2;
              const contentCenterX = (centerScreenX - prev.tx) / prev.s;
              const contentCenterY = (centerScreenY - prev.ty) / prev.s;

              // найдём ближайший узел к центру
              let best: PositionedNode | null = null;
              let bestDist = Infinity;
              for (const n of nodes) {
                const dx = n.cx - contentCenterX;
                const dy = n.cy - contentCenterY;
                const d = Math.hypot(dx, dy);
                if (d < bestDist) {
                  bestDist = d;
                  best = n;
                }
              }

              if (best) {
                const targetScale = SCALE_1;
                const tx = wrapperRect.width / 2 - best.cx * targetScale;
                const ty = wrapperRect.height / 2 - best.cy * targetScale;
                return { tx: tx, ty, s: targetScale };
              }
            }
          } catch (e) {
            // fallback to simple step
          }

          return { ...prev, s: SCALE_1 };
        }

        // если мы уменьшаем с уровня SCALE_1 -> 1, попробуем сохранить центрировку
        if (Math.abs(prev.s - SCALE_1) < EPS) {
          try {
            const board = boardRef?.current;
            if (board && selectedId) {
              const wrapper = (board.parentElement as HTMLElement) || board;
              const wrapperRect = wrapper.getBoundingClientRect();
              const node = nodes.find((n) => n.id === selectedId);
              if (node) {
                const targetScale = 1;
                const tx = wrapperRect.width / 2 - node.cx * targetScale;
                const ty = wrapperRect.height / 2 - node.cy * targetScale;
                return { tx: tx - 250, ty, s: targetScale };
              }
            }
          } catch (e) {
            // fallthrough to default reset
          }
        }

        // любые другие случаи — сброс
        return { tx: 0, ty: 0, s: 1 };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomOutTrigger]);

  // refs для drag
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOriginRef = useRef({ tx: 0, ty: 0 });
  // refs для обнаружения факта drag и подавления клика
  const draggedRef = useRef(false);
  const suppressClickRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (transform.s <= 1) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOriginRef.current = { tx: transform.tx, ty: transform.ty };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (!draggedRef.current && Math.hypot(dx, dy) > 6) {
      draggedRef.current = true;
    }
    setTransform((prev) => ({
      ...prev,
      tx: dragOriginRef.current.tx + dx,
      ty: dragOriginRef.current.ty + dy,
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    if (draggedRef.current) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 200);
      draggedRef.current = false;
    }
  };

  const MOVE_STEP = 30; // Шаг движения при нажатии стрелки

  const handleKeyDown = (e: KeyboardEvent) => {
    if (transform.s <= 1) return;

    let moved = false;
    let newTx = transform.tx;
    let newTy = transform.ty;

    switch (e.key) {
      case "ArrowLeft":
        newTx += MOVE_STEP;
        moved = true;
        break;
      case "ArrowRight":
        newTx -= MOVE_STEP;
        moved = true;
        break;
      case "ArrowUp":
        newTy += MOVE_STEP;
        moved = true;
        break;
      case "ArrowDown":
        newTy -= MOVE_STEP;
        moved = true;
        break;
      default:
        break;
    }

    if (moved) {
      e.preventDefault();
      setTransform((prev) => ({ ...prev, tx: newTx, ty: newTy }));
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // ---------- логический zoomLevel (1 / 2 / 3) ----------
  const zoomLevel: 1 | 2 | 3 = (() => {
    const EPS = 0.0001;
    if (transform.s >= SCALE_2 - EPS) return 3;
    if (transform.s >= SCALE_1 - EPS) return 2;
    return 1;
  })();

  // ---------- получаем контент для ноды при текущем уровне ----------
  // кеш рассчитанных позиций с меткой времени { ts, items } и флагом locked
  const contentCacheRef = useRef<
    Map<string, { ts: number; items: DistributedItem[]; locked?: boolean }>
  >(new Map());
  // таймеры для перехода в locked-состояние через 1 секунду
  const lockTimersRef = useRef<Map<string, number>>(new Map());

  // при размонтировании очищаем таймеры
  useEffect(() => {
    return () => {
      lockTimersRef.current.forEach((id) => clearTimeout(id));
      lockTimersRef.current.clear();
    };
  }, []);
  // очистка кеша при внешнем триггере (если нужно пересчитать позиции)
  useEffect(() => {
    if (typeof resetZoomTrigger === "number") {
      contentCacheRef.current.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetZoomTrigger]);

  const getNodeContent = (node: PositionedNode): DistributedItem[] => {
    if (zoomLevel === 1) return [];

    const level: ZoomLevel = zoomLevel === 2 ? 2 : 3;
    // filter behaviour:
    // - activeFilter === 'tg'  => show only telegrams for all nodes, except keep full content for `tg-channels`
    // - activeFilter === 'media' => show only assets (suppress telegrams) for all nodes
    // - otherwise => default behaviour
    const isTgFilter = activeFilter === "tg";
    const isMediaFilter = activeFilter === "media";

    const otherParam = isTgFilter && node.id !== "tg-channels" ? null : level === 3 ? node.otherAssets : null;

    // compute params depending on active filter
    const keyAssetsParamForCompute = isTgFilter && node.id !== "tg-channels" ? "" : node.keyAssets;
    // default: use node.keyTelegrams (if present)
    let keyTelegramsParam: string | undefined = node.keyTelegrams;
    if (isMediaFilter) {
      // media filter: suppress telegrams everywhere
      keyTelegramsParam = "";
    }

    // special-case: tg-channels should show only first 3 telegrams on level 2
    if (node.id === "tg-channels" && level === 2) {
      // prefer explicit keyTelegrams; fall back to otherAssets or keyAssets if absent
      const source =
        node.keyTelegrams ?? node.otherAssets ?? node.keyAssets ?? "";
      const parts = String(source)
        .split(/[;,]/)
        .map((t) => t.trim())
        .filter(Boolean);
      keyTelegramsParam = parts.slice(0, 3).join(", ");
    }
    // include filter state in cache key so cached positions for different
    // filter modes do not collide
    const key = `${node.id}_${level}_${activeFilter ?? "all"}`;

    // Попытка загрузить из памяти (сначала in-memory cache)
    const cachedEntry = contentCacheRef.current.get(key);
    if (cachedEntry) return cachedEntry.items;

    // Попытка загрузить из localStorage — чтобы позиции были стабильны между перезагрузками
    try {
      const raw = localStorage.getItem(`media-radar-pos:${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          ts?: number;
          items?: DistributedItem[];
          locked?: boolean;
        };
        if (parsed && Array.isArray(parsed.items)) {
          contentCacheRef.current.set(key, {
            ts: parsed.ts || Date.now(),
            items: parsed.items,
            locked: !!parsed.locked,
          });
          return parsed.items;
        }
      }
    } catch (e) {
      // ignore
    }

    const computed = distributeContentInCircle(
      node.name,
      keyAssetsParamForCompute,
      keyTelegramsParam,
      otherParam,
      diameter, // базовый диаметр, зум учитывается transform'ом
      false // includeName=false, имя рендерим в центре
    );

    // Сохраняем результат сразу и помечаем как locked: true —
    // это гарантирует, что позиции не будут пересчитаны и не будут "шевелиться"
    const now = Date.now();
    const entry = { ts: now, items: computed, locked: true };
    try {
      localStorage.setItem(`media-radar-pos:${key}`, JSON.stringify(entry));
    } catch (e) {
      // ignore (quota или приватный режим)
    }

    contentCacheRef.current.set(key, entry);
    return computed;
  };

  const handleClick = (node: PositionedNode) => {
    if (suppressClickRef.current) return;

    const board = boardRef?.current;
    if (!board) {
      onSelect(holdingsPool.find((h) => h.id === node.id) ?? null);
      return;
    }

    // кликом из первого уровня сразу уходим в 3-й
    const targetScale = SCALE_2;
    const wrapper = (board.parentElement as HTMLElement) || board;
    const wrapperRect = wrapper.getBoundingClientRect();

    const tx = wrapperRect.width / 2 - node.cx * targetScale;
    const ty = wrapperRect.height / 2 - node.cy * targetScale;

    setTransform({ tx: tx - 250, ty, s: targetScale });
    // If modal for this node is already open, don't reopen it again.
    if (selectedId === node.id) return;

    if (node.id === "tg-channels") return;
    onSelect(holdingsPool.find((h) => h.id === node.id) ?? null);
  };

  return (
    <div className={styles["radar-wrapper"]}>
      <section
        className={styles["radar-board"]}
        ref={boardRef}
        style={{
          transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.s})`,
          cursor: transform.s > 1 ? "grab" : "auto",
        }}
        onMouseDown={handleMouseDown}
      >
        {nodes.map((node) => {
          const content = getNodeContent(node);

          // determine if this node contains any warm contact (for level 1 indicator)
          const nodeValues: string[] = [];
          if (node.keyAssets) nodeValues.push(...String(node.keyAssets).split(/[;,]/));
          if (node.keyTelegrams) nodeValues.push(...String(node.keyTelegrams).split(/[;,]/));
          if (node.otherAssets) nodeValues.push(...String(node.otherAssets).split(/[;,]/));
          const hasWarm = nodeValues
            .map((s) => s.trim().toLowerCase())
            .some((t) => t && warmSet.has(t));

          // вычисляем размер шрифта для центрального названия так,
          // чтобы оно не переносилось и умещалось в круге — уменьшаем при необходимости
          const nameMaxWidth = diameter * 0.6; // допустимая ширина внутри круга
          const baseFont = 14; // предпочитаемый размер
          const minFont = 9; // минимальный размер
          const approxCharWidth = 0.55; // прибл. ширина символа относительно font-size
          const desiredFont = Math.floor(
            nameMaxWidth / (Math.max(1, node.name.length) * approxCharWidth)
          );
          const nameFont = Math.max(minFont, Math.min(baseFont, desiredFont));

          return (
            <div
              key={node.id}
              className={`${styles["radar-node"]} ${
                node.accent ? styles["radar-node--accent"] : ""
              } ${node.id === "tg-channels" ? styles["radar-node--tg"] : ""}`}
              style={{
                left: node.cx,
                top: node.cy,
                width: diameter,
                height: diameter,
              }}
              onClick={() => handleClick(node)}
            >
              {zoomLevel === 1 && hasWarm && activeFilter === "warm" && (
                <div className={styles["radar-node__warm-indicator"]} />
              )}
              {/* название холдинга всегда в центре — не переносим, подгоняем font-size */}
              <span
                style={{
                  pointerEvents: "none",
                  zIndex: 2,
                  display: "inline-block",
                  maxWidth: `${nameMaxWidth}px`,
                  fontSize: `${nameFont}px`,
                  whiteSpace: "nowrap",
                  overflow: "visible",
                  textOverflow: "clip",
                  textAlign: "center",
                }}
                title={node.name}
              >
                {node.name}
              </span>

              {zoomLevel > 1 && content.length > 0 && (
                <div className={styles["radar-node__content"]}>
                  {content.map((item) => {
                    const isWarmFilterActive = activeFilter === "warm";
                    const normalized = item.text.trim().toLowerCase();
                    const isWarmItem = isWarmFilterActive && warmSet.has(normalized);
                    const radians = (item.angle * Math.PI) / 180;
                    // ВАЖНО: координаты считаются в локальных единицах базового диаметра.
                    // Масштаб зума уже применён к родителю через transform.s —
                    // поэтому ничего не делим на scale.
                    const x = item.radius * Math.cos(radians);
                    const y = item.radius * Math.sin(radians);

                    // helper: normalize text (remove punctuation, collapse spaces)
                    const normalize = (s: string) =>
                      String(s)
                        .normalize("NFKC")
                        .replace(/\p{P}/gu, "")
                        .replace(/\s+/g, " ")
                        .trim()
                        .toLowerCase();

                    // helper: find best matching holding for a given label
                    const findHoldingForLabel = (label: string) => {
                      const key = normalize(label);

                      // 1) exact name match (normalized)
                      let h = holdingsPool.find(
                        (hh) => normalize(hh.name || "") === key
                      );
                      if (h) return h;

                      // 2) check keyTelegrams and keyAssets lists for normalized entries
                      for (const hh of holdingsPool) {
                        if (hh.keyTelegrams) {
                          const list = String(hh.keyTelegrams)
                            .split(/[;,]/)
                            .map((t) => normalize(t));
                          if (list.includes(key)) return hh;
                        }
                        if (hh.keyAssets) {
                          const list = String(hh.keyAssets)
                            .split(/[;,]/)
                            .map((t) => normalize(t));
                          if (list.includes(key)) return hh;
                        }
                        if (hh.otherAssets) {
                          const list = String(hh.otherAssets)
                            .split(/[;,]/)
                            .map((t) => normalize(t));
                          if (list.includes(key)) return hh;
                        }
                      }

                      // 3) fuzzy contains: normalized name contains key or key contains normalized name
                      for (const hh of holdingsPool) {
                        const n = normalize(hh.name || "");
                        if (!n) continue;
                        if (n.includes(key) || key.includes(n)) return hh;
                      }

                      return undefined;
                    };

                    return (
                      <div
                        key={item.id}
                        className={`${styles["radar-node__item"]} ${
                          styles[`radar-node__item--${item.type}`]
                        } ${isWarmItem ? styles["radar-node__item--warm"] : ""}`}
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          fontSize: `${item.fontSize}px`,
                          width: isWarmItem ? "auto" : `${item.maxWidth}px`,
                          minWidth: isWarmItem ? 40 : undefined,
                          whiteSpace: "normal",
                          textAlign: "center",
                          lineHeight: 1.2,
                          padding: "2px 6px",
                          cursor: "pointer",
                        }}
                        title={item.text}
                        onClick={(e) => {
                          // prevent node click
                          e.stopPropagation();
                          const raw = item.text;
                          const match = findHoldingForLabel(raw);
                          // debug logging to help trace mismatches
                          // eslint-disable-next-line no-console
                          console.log("RadarBoard: item click", { raw, normalized: normalize(raw), matchId: match?.id ?? null, parentNodeId: node.id });

                          // If the match corresponds to the parent node, do not open
                          // the parent holding's modal — users asked to see item-specific
                          // data only when clicking inner elements.
                          if (match && match.id !== node.id) {
                            onSelect(match);
                            return;
                          }

                          // If no matching holding exists, open a synthetic minimal
                          // holding record for this element so the modal shows element-specific data.
                          const synthetic: HoldingNode = {
                            id: `synthetic-${node.id}-${item.id}`,
                            name: raw,
                            description: undefined,
                            keyAssets: undefined,
                            keyTelegrams: undefined,
                            otherAssets: undefined,
                          };
                          // eslint-disable-next-line no-console
                          console.log("RadarBoard: opening synthetic holding", synthetic.id);
                          onSelect(synthetic);
                        }}
                      >
                        {item.text}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};
