import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import { holdingsLevelOne, type HoldingNode, tgChannels } from "./data/holdings";
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
  const [activeFilter, setActiveFilter] = useState<string>("all");
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

    for (let i = 0; i < holdingsLevelOne.length; i++) {
      res.push({
        ...holdingsLevelOne[i],
        cx: MARGIN + r + Math.random() * (w - 2 * (MARGIN + r)),
        cy: MARGIN + r + Math.random() * (h - 2 * (MARGIN + r)),
        vx: 0,
        vy: 0,
      });
    }

    return res;
  };

  // -----------------------
  // 2. ФИЗИКА (разъезжание)
  // -----------------------
  const physics = (w: number, h: number) => {
    const r = DIAMETER / 2;
    const minDist = DIAMETER + GAP;

    let iteration = 0;
    const MAX_ITER = 40; // максимум ~20 кадров
    const SPEED_THRESHOLD = 0.05; // если все скорости меньше — останавливаемся

    function step() {
      const list = nodesRef.current;
      let maxSpeed = 0;

      // отталкивание кругов друг от друга
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
            const force = overlap * 0.03;

            A.vx -= nx * force;
            A.vy -= ny * force;
            B.vx += nx * force;
            B.vy += ny * force;
          }
        }
      }

      // применяем скорости + затухание + рамка
      for (const n of list) {
        n.cx += n.vx;
        n.cy += n.vy;

        n.vx *= 0.85;
        n.vy *= 0.85;

        const speed = Math.hypot(n.vx, n.vy);
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

      setNodes([...list]);

      iteration++;

      // УСЛОВИЕ ОСТАНОВКИ:
      // 1) сделали достаточно шагов
      // 2) или все скорости уже маленькие — система "успокоилась"
      if (iteration >= MAX_ITER || maxSpeed < SPEED_THRESHOLD) {
        return; // больше не вызываем requestAnimationFrame
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
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
    nodesRef.current = initial;
    setNodes([...initial]);

    // запускаем физику
    physics(w, h);

    // следим за изменениями размера
    const ro = new ResizeObserver(() => {
      const rect2 = boardRef.current!.getBoundingClientRect();
      gentleResizeAdjust(rect2.width, rect2.height);
    });

    ro.observe(boardRef.current);

    return () => ro.disconnect();
  }, []);

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

  const filterOptions = [
    { id: "all", label: "Все", active: activeFilter === "all" },
    { id: "private", label: "Частные", active: activeFilter === "private" },
    { id: "warm", label: "Тёплый контакт", active: activeFilter === "warm" },
    { id: "media", label: "СМИ", active: activeFilter === "media" },
    { id: "tg", label: "Telegram", active: activeFilter === "tg" },
  ];

  const handleToggleFilterOption = (id: string) => {
    // single-selection behavior: selecting an already active option resets to "all"
    setActiveFilter((prev) => (prev === id ? "all" : id));
    // NOTE: do not close the filter dropdown after selecting an option —
    // user requested the menu to stay open when choosing "Telegram".
  };

  return (
    <>
      <div className={styles["app"]}>
        <AppHeader
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
          onCloseFilter={() => setIsFilterOpen(false)}
          onZoomIn={() => setZoomInTrigger((t) => t + 1)}
          onZoomOut={() => setZoomOutTrigger((t) => t + 1)}
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
