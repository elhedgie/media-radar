import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import {
  holdingsLevelOne,
  type HoldingNode,
  tgChannels,
} from "./data/holdings";
import type { PositionedNode } from "./types";
import { RadarBoard } from "./components/RadarBoard";
// DetailsDrawer temporarily unused
import { DetailsDrawer } from "./components/DetailsDrawer";
import { AppHeader } from "./components/AppHeader";

const DIAMETER = 205;
const GAP = 18;
const MARGIN = 40;

export default function App() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<PositionedNode[]>([]);
  const nodesRef = useRef<PositionedNode[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // activeFilter: array of selected filter ids, e.g. ['warm','media']
  // default is ['all'] which means both СМИ и Telegram
  const [activeFilter, setActiveFilter] = useState<string[]>(["all"]);
  const [selectedHolding, setSelectedHolding] = useState<HoldingNode | null>(
    null
  );
  // триггер для сброса зума в RadarBoard
  const [resetZoomTrigger, _setResetZoomTrigger] = useState(0);
  // триггеры для кнопок зума
  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);

  // -----------------------
  // 1. СТАРТОВЫЙ РАНДОМ
  // -----------------------
  const createInitial = (w: number, h: number) => {
    const res: PositionedNode[] = [];
    const r = DIAMETER / 2;

    // Grid-based initial placement to avoid heavy initial overlaps.
    const n = holdingsLevelOne.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);

    const availableW = Math.max(1, w - 2 * (MARGIN + r));
    const availableH = Math.max(1, h - 2 * (MARGIN + r));
    const xStep = availableW / (cols + 1);
    const yStep = availableH / (rows + 1);

    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = MARGIN + r + xStep * (col + 1);
      const cy = MARGIN + r + yStep * (row + 1);
      res.push({
        ...holdingsLevelOne[i],
        cx,
        cy,
        vx: 0,
        vy: 0,
      });
    }

    return res;
  };

  // -----------------------
  // 2. SYNCHRONOUS RELAXATION (compute final positions immediately)
  // -----------------------
  // Compute final positions synchronously (no animation) and return settled array.
  const relaxPositions = (
    srcList: PositionedNode[],
    w: number,
    h: number
  ): PositionedNode[] => {
    const r = DIAMETER / 2;
    const minDist = DIAMETER + GAP;

    // clone nodes so we don't mutate external refs
    const list: PositionedNode[] = srcList.map((n) => ({ ...n }));

    let iteration = 0;
    const MAX_ITER = 120;
    const SPEED_THRESHOLD = 0.05;

    while (iteration < MAX_ITER) {
      let maxSpeed = 0;

      // forces
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const A = list[i];
          const B = list[j];

          let dx = B.cx - A.cx;
          let dy = B.cy - A.cy;
          let dist = Math.hypot(dx, dy);
          if (dist < 0.001) dist = 0.001;

          if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            const force = overlap * 0.02;

            A.vx = (A.vx || 0) - nx * force;
            A.vy = (A.vy || 0) - ny * force;
            B.vx = (B.vx || 0) + nx * force;
            B.vy = (B.vy || 0) + ny * force;
          }
        }
      }

      // integrate
      for (const n of list) {
        const MAX_V = 12;
        if (n.vx && n.vx > MAX_V) n.vx = MAX_V;
        if (n.vx && n.vx < -MAX_V) n.vx = -MAX_V;
        if (n.vy && n.vy > MAX_V) n.vy = MAX_V;
        if (n.vy && n.vy < -MAX_V) n.vy = -MAX_V;

        n.cx += n.vx || 0;
        n.cy += n.vy || 0;

        n.vx = (n.vx || 0) * 0.92;
        n.vy = (n.vy || 0) * 0.92;

        const speed = Math.hypot(n.vx || 0, n.vy || 0);
        if (speed > maxSpeed) maxSpeed = speed;

        const minX = MARGIN + r;
        const maxX = w - MARGIN - r;
        const minY = MARGIN + r;
        const maxY = h - MARGIN - r;

        if (n.cx < minX) n.cx = minX;
        if (n.cx > maxX) n.cx = maxX;
        if (n.cy < minY) n.cy = minY;
        if (n.cy > maxY) n.cy = maxY;
      }

      iteration++;
      if (maxSpeed < SPEED_THRESHOLD) break;
    }

    return list;
  };

  // -----------------------
  // 3. МЯГКАЯ РЕАКЦИЯ НА RESIZE
  // -----------------------
  const gentleResizeAdjust = (w: number, h: number) => {
    const r = DIAMETER / 2;

    const list = nodesRef.current;
    let changed = false;

    for (const n of list) {
      const minX = MARGIN + r;
      const maxX = w - MARGIN - r;
      const minY = MARGIN + r;
      const maxY = h - MARGIN - r;

      if (n.cx < minX) {
        n.cx = minX;
        changed = true;
      }
      if (n.cx > maxX) {
        n.cx = maxX;
        changed = true;
      }
      if (n.cy < minY) {
        n.cy = minY;
        changed = true;
      }
      if (n.cy > maxY) {
        n.cy = maxY;
        changed = true;
      }
    }

    if (changed) setNodes([...list]);
  };

  // -----------------------
  // 4. ИНИЦИАЛИЗАЦИЯ
  // -----------------------
  useLayoutEffect(() => {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // создаём стартовый layout один раз
    const initial = createInitial(w, h);
    // рассчитываем финальные позиции синхронно и ставим их сразу
    const settled = relaxPositions(initial, w, h);
    nodesRef.current = settled;
    setNodes([...settled]);

    // следим за изменениями размера
    const ro = new ResizeObserver(() => {
      const rect2 = boardRef.current!.getBoundingClientRect();
      gentleResizeAdjust(rect2.width, rect2.height);
    });

    ro.observe(boardRef.current);

    return () => ro.disconnect();
  }, []);

  // Когда изменяется набор фильтров, перераспределяем узлы, чтобы убрать возможные перекрытия
  useEffect(() => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    // пересчитаем позиции синхронно и сразу установим итоговую раскладку
    const settled = relaxPositions(nodesRef.current, rect.width, rect.height);
    nodesRef.current = settled;
    setNodes([...settled]);
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
        setSelectedHolding(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const baseOptions = [
    { id: "all", label: "СМИ и Telegram" },
    { id: "private", label: "Частные" },
    { id: "warm", label: "Тёплый контакт" },
    { id: "media", label: "СМИ" },
    { id: "tg", label: "Telegram" },
  ];

  // derive active flag for UI
  const activeSet = new Set(activeFilter);
  const filterOptions = baseOptions.map((opt) => ({
    ...opt,
    active: activeSet.has(opt.id),
  }));

  const handleToggleFilterOption = (id: string) => {
    setActiveFilter((prev) => {
      const s = new Set(prev);
      // selecting 'all' resets everything
      if (id === "all") return ["all"];

      // remove the 'all' placeholder if present
      s.delete("all");

      if (id === "warm") {
        if (s.has("warm")) s.delete("warm");
        else s.add("warm");
      } else if (id === "media" || id === "tg") {
        // media and tg are mutually exclusive
        if (s.has(id)) s.delete(id);
        else {
          s.delete(id === "media" ? "tg" : "media");
          s.add(id);
        }
      } else {
        // toggle other options (e.g., private)
        if (s.has(id)) s.delete(id);
        else s.add(id);
      }

      if (s.size === 0) return ["all"];
      return Array.from(s);
    });
    // NOTE: keep dropdown open per UX request
  };

  return (
    <>
      <div className={styles["app"]}>
        <AppHeader
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
          onCloseFilter={() => setIsFilterOpen(false)}
          onZoomIn={() => setZoomInTrigger((t) => t + 1)}
          onZoomOut={() => {
            // If modal is open, close it and step zoom once (to level 2)
            if (selectedHolding) {
              setSelectedHolding(null);
              // trigger one zoom-out step in the board
              setZoomOutTrigger((t) => t + 1);
              return;
            }
            setZoomOutTrigger((t) => t + 1);
          }}
          filterOptions={filterOptions}
          onToggleFilterOption={handleToggleFilterOption}
        />

        <RadarBoard
          nodes={nodes}
          diameter={DIAMETER}
          onSelect={(h) => {
            // Always update modal: if the same holding was selected, briefly
            // clear selection to force a re-render so users can click the same
            // item repeatedly and see its data refreshed.
            if (!h) {
              setSelectedHolding(null);
              return;
            }
            if (selectedHolding && selectedHolding.id === h.id) {
              setSelectedHolding(null);
              // schedule next set to allow state change
              setTimeout(() => setSelectedHolding(h), 0);
            } else {
              setSelectedHolding(h);
            }
          }}
          holdingsPool={[...holdingsLevelOne, ...tgChannels]}
          boardRef={boardRef}
          activeFilter={activeFilter}
          selectedId={selectedHolding?.id}
          resetZoomTrigger={resetZoomTrigger}
          zoomInTrigger={zoomInTrigger}
          zoomOutTrigger={zoomOutTrigger}
        />
      </div>
      <DetailsDrawer
        holding={selectedHolding}
        onClose={() => {
          setSelectedHolding(null);
          _setResetZoomTrigger((t) => t + 1);
        }}
      />
    </>
  );
}
