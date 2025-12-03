import type { FC, RefObject } from "react";
import { useRef, useEffect, useState } from "react";
import styles from "../App.module.css";
import type { PositionedNode } from "../types";
import type { HoldingNode } from "../data/holdings";
import { manualLayout } from "../data/manualLayout";
import { warmSet } from "../data/warmContacts";

// локальный тип уровня зума (2 или 3)
type ZoomLevel = 2 | 3;

type DistributedItem = {
  id: string;
  type: "asset" | "telegram";
  text: string;
  offsetX?: number;
  offsetY?: number;
  fontSize?: number;
  maxWidth?: number;
  manual?: boolean;
};

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
  activeFilter?: string | string[];
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
  // анимация трансформации: плавный переход между состояниями
  const animReqRef = useRef<number | null>(null);
  const animStartRef = useRef<number>(0);
  const animFromRef = useRef<{ tx: number; ty: number; s: number } | null>(
    null
  );
  const animToRef = useRef<{ tx: number; ty: number; s: number } | null>(null);
  const ANIM_DURATION = 420; // мс

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const animateTo = (to: { tx: number; ty: number; s: number }) => {
    if (animReqRef.current) {
      cancelAnimationFrame(animReqRef.current);
      animReqRef.current = null;
    }
    animStartRef.current = performance.now();
    animFromRef.current = { ...transform };
    animToRef.current = to;

    const step = (now: number) => {
      const start = animStartRef.current;
      const from = animFromRef.current!;
      const target = animToRef.current!;
      const t = Math.min(1, (now - start) / ANIM_DURATION);
      const k = easeInOutCubic(t);
      setTransform({
        tx: from.tx + (target.tx - from.tx) * k,
        ty: from.ty + (target.ty - from.ty) * k,
        s: from.s + (target.s - from.s) * k,
      });
      if (t < 1) {
        animReqRef.current = requestAnimationFrame(step);
      } else {
        animReqRef.current = null;
      }
    };
    animReqRef.current = requestAnimationFrame(step);
  };
  // small pop animation on mount
  const [poping, setPoping] = useState(true);
  // форс-показ узла после клика, даже если фильтр скрывает его контент
  const [forceVisibleId, setForceVisibleId] = useState<string | null>(null);

  // фиксированный размер шрифта для всех меток (используем в стилях ниже)

  useEffect(() => {
    const t = setTimeout(() => setPoping(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Сброс трансформации при изменении внешнего триггера
  useEffect(() => {
    if (typeof resetZoomTrigger === "number") {
      setTransform({ tx: 0, ty: 0, s: 1 });
      setForceVisibleId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetZoomTrigger]);

  // Фиксированные уровни зума: базовый diameter (prop), 380 и 598 (как по ТЗ)
  const BASE_DIAMETER = diameter; // 205
  const ZOOM_DIAMETER_1 = 380;
  const ZOOM_DIAMETER_2 = 598;

  const SCALE_1 = ZOOM_DIAMETER_1 / BASE_DIAMETER;
  const SCALE_2 = ZOOM_DIAMETER_2 / BASE_DIAMETER;

  // Высота доски: нужна для стабильного центрирования по Y
  const computeBoardHeight = (nodesList: PositionedNode[]) => {
    if (!nodesList || nodesList.length === 0) return 0;
    const radius = diameter / 2;
    const filterSetLocal = filterSet; // reuse current filter set
    const visibleNodes = (
      zoomLevel > 1
        ? nodesList.filter((node) => {
            const content = getNodeContent(node);
            const hasContent = Array.isArray(content) && content.length > 0;
            const isSelected = selectedId === node.id;
            const isForced = forceVisibleId === node.id;
            return hasContent || isSelected || isForced;
          })
        : nodesList.filter(
            (node) =>
              !(
                node.id === "tg-channels" &&
                filterSetLocal.has("media") &&
                !filterSetLocal.has("tg")
              )
          )
    ) as PositionedNode[];
    const maxBottom = visibleNodes.reduce(
      (acc, n) => Math.max(acc, n.cy + radius),
      0
    );
    return Math.ceil(maxBottom + 20);
  };

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
            const fixedWidth = 1440; // стабильная ширина для логики зума
            const fixedHeight = computeBoardHeight(nodes);

            const centerScreenX = fixedWidth / 2;
            const centerScreenY = fixedHeight / 2;
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
            if (best && bestDist < Math.max(fixedWidth, fixedHeight) * 0.5) {
              nodeToCenter = best;
            } else if (selectedId) {
              nodeToCenter = nodes.find((n) => n.id === selectedId);
            }

            if (nodeToCenter) {
              const tx = fixedWidth / 2 - nodeToCenter.cx * target;
              const ty = fixedHeight / 2 - nodeToCenter.cy * target;
              // плавная анимация к целевому состоянию
              animateTo({ tx, ty, s: target });
              return prev; // состояние обновится через анимацию
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
              const fixedWidth = 1440;
              const fixedHeight = computeBoardHeight(nodes);
              const centerScreenX = fixedWidth / 2;
              const centerScreenY = fixedHeight / 2;
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
                const tx = fixedWidth / 2 - best.cx * targetScale;
                const ty = fixedHeight / 2 - best.cy * targetScale;
                animateTo({ tx, ty, s: targetScale });
                return prev;
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
              const fixedWidth = 1440;
              const fixedHeight = computeBoardHeight(nodes);
              const node = nodes.find((n) => n.id === selectedId);
              if (node) {
                const targetScale = 1;
                const tx = fixedWidth / 2 - node.cx * targetScale - 250;
                const ty = fixedHeight / 2 - node.cy * targetScale;
                animateTo({ tx, ty, s: targetScale });
                return prev;
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

  // normalize activeFilter into an array/set so rendering can reference it
  const filterSet = new Set(
    Array.isArray(activeFilter)
      ? activeFilter
      : typeof activeFilter === "string"
      ? [activeFilter]
      : ["all"]
  );

  const getNodeContent = (node: PositionedNode): DistributedItem[] => {
    if (zoomLevel === 1) return [];

    const level: ZoomLevel = zoomLevel === 2 ? 2 : 3;
    // filter behaviour:
    // - activeFilter === 'tg'  => show only telegrams for all nodes, except keep full content for `tg-channels`
    // - activeFilter === 'media' => show only assets (suppress telegrams) for all nodes
    // - otherwise => default behaviour
    // текущие фильтры отражены в allowedTypes ниже

    // кеш не используем — контент берём напрямую из manualLayout

    // Берём статическую раскладку из `manualLayout` — если нет, возвращаем пустой список
    const layout = manualLayout[node.id] ?? [];

    // Подготовим набор ключевых активов для текущего холдинга
    const normalize = (s: string) =>
      String(s)
        .normalize("NFKC")
        .replace(/\p{P}/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const keyAssetsSet: Set<string> = (() => {
      const raw = node.keyAssets ? String(node.keyAssets) : "";
      const parts = raw
        .split(/[;,]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => normalize(t));
      return new Set(parts);
    })();

    // Фильтрация по уровню зума:
    // level 2: показываем только ключевые медиа-активы и телеграм-каналы,
    //          но для специального круга 'tg-channels' оставляем только 3 канала
    // level 3: показываем всё из manualLayout
    let layoutItems = layout.filter((it) => {
      if (level === 3) return true;
      // level === 2
      if (it.type === "telegram") return true;
      if (it.type === "asset") {
        return keyAssetsSet.has(normalize(it.text));
      }
      return false;
    });

    // На уровне 2 в круге со всеми телеграм-каналами показываем только три
    if (level === 2 && node.id === "tg-channels") {
      const tgOnly = layoutItems.filter((it) => it.type === "telegram");
      const firstThree = tgOnly.slice(0, 3);
      layoutItems = firstThree;
    }

    // allowed types согласно фильтрам
    const allowedTypes: DistributedItem["type"][] = (() => {
      const hasMedia = filterSet.has("media");
      const hasTg = filterSet.has("tg");
      if (hasMedia && !hasTg) return ["asset"];
      if (hasTg && !hasMedia) return ["telegram"];
      return ["asset", "telegram"];
    })();

    const mapped: DistributedItem[] = layoutItems.map((it, idx) => ({
      id: `${node.id}-${idx}`,
      type: it.type,
      text: it.text,
      offsetX: it.x,
      offsetY: it.y,
      fontSize: 11,
      maxWidth: 100,
      manual: true,
    }));

    // Тёплый фильтр не скрывает элементы — только подсвечивает.
    return mapped.filter((it) => allowedTypes.includes(it.type));
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

    const tx = wrapperRect.width / 2 - node.cx * targetScale - 250;
    const ty = wrapperRect.height / 2 - node.cy * targetScale;

    animateTo({ tx, ty, s: targetScale });
    // форсируем видимость кликнутого узла на уровне 2/3
    setForceVisibleId(node.id);
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
          height: `${computeBoardHeight(nodes)}px`,
          transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.s})`,
          cursor: transform.s > 1 ? "grab" : "auto",
        }}
        onMouseDown={handleMouseDown}
      >
        {(zoomLevel > 1
          ? // на уровнях 2/3 не скрываем круги вовсе
            nodes
          : // обзор (level 1): скрываем только специальный `tg-channels`, если выбран только media
            nodes.filter(
              (node) =>
                !(
                  node.id === "tg-channels" &&
                  filterSet.has("media") &&
                  !filterSet.has("tg")
                )
            )
        ).map((node) => {
          const content = getNodeContent(node);

          // determine if this node contains any warm contact (for level 1 indicator)
          // Behavior:
          // - if 'media' selected (without 'tg') => check only media fields (keyAssets, otherAssets)
          // - if 'tg' selected (without 'media') => check only telegrams (keyTelegrams)
          // - otherwise => check all fields
          let hasWarm = false;
          const checkList = (vals?: string | null) =>
            vals
              ? String(vals)
                  .split(/[;,]/)
                  .map((s) => s.trim().toLowerCase())
                  .filter(Boolean)
              : [];

          const onlyMedia = filterSet.has("media") && !filterSet.has("tg");
          const onlyTg = filterSet.has("tg") && !filterSet.has("media");

          if (onlyMedia) {
            const mediaVals = [
              ...checkList(node.keyAssets),
              ...checkList(node.otherAssets),
            ];
            hasWarm = mediaVals.some((t) => warmSet.has(t));
          } else if (onlyTg) {
            const tgVals = checkList(node.keyTelegrams);
            hasWarm = tgVals.some((t) => warmSet.has(t));
          } else {
            // default: any warm across all fields
            const allVals = [
              ...checkList(node.keyAssets),
              ...checkList(node.keyTelegrams),
              ...checkList(node.otherAssets),
            ];
            hasWarm = allVals.some((t) => warmSet.has(t));
          }

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
              } ${node.id === "tg-channels" ? styles["radar-node--tg"] : ""} ${
                poping ? styles["radar-node--pop"] : ""
              }`}
              style={{
                left: node.cx,
                top: node.cy,
                width: diameter,
                height: diameter,
              }}
              onClick={() => handleClick(node)}
            >
              {zoomLevel === 1 && hasWarm && filterSet.has("warm") && (
                <div className={styles["radar-node__warm-indicator"]} />
              )}
              {/* название холдинга всегда в центре — не переносим, подгоняем font-size */}
              <span
                style={{
                  pointerEvents: "none",
                  zIndex: 2,
                  display: "inline-block",
                  maxWidth: `${nameMaxWidth}px`,
                  fontSize: `${zoomLevel === 1 ? 14 : nameFont}px`,
                  fontWeight: zoomLevel === 1 ? 600 : undefined,
                  whiteSpace: zoomLevel === 1 ? "normal" : "nowrap",
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
                    const isWarmFilterActive = filterSet.has("warm");
                    const normalized = item.text.trim().toLowerCase();
                    const isWarmItem =
                      isWarmFilterActive && warmSet.has(normalized);
                    // Если элемент содержит явные смещения — используем их напрямую.
                    // Это позволяет вручную подгонять позицию каждого элемента по X/Y в px
                    // относительно центра круга.
                    const x =
                      typeof item.offsetX === "number" ? item.offsetX : 0;
                    const y =
                      typeof item.offsetY === "number" ? item.offsetY : 0;

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
                        } ${
                          isWarmItem ? styles["radar-node__item--warm"] : ""
                        }`}
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          fontSize: `7px`,
                          width: "auto",
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
                          console.log("RadarBoard: item click", {
                            raw,
                            normalized: normalize(raw),
                            matchId: match?.id ?? null,
                            parentNodeId: node.id,
                          });

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
                          console.log(
                            "RadarBoard: opening synthetic holding",
                            synthetic.id
                          );
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
