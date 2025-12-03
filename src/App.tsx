import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import {
  holdingsLevelOne,
  type HoldingNode,
  tgChannels,
} from "./data/holdings";
import type { PositionedNode } from "./types";
import { RadarBoard } from "./components/RadarBoard";
import { DetailsDrawer } from "./components/DetailsDrawer";
import { AppHeader } from "./components/AppHeader";

const DIAMETER = 205;
const GAP = 18;
const MARGIN = 40;

// Виртуальная ширина, в которой считаем раскладку ВСЕГДА
const LAYOUT_WIDTH = 1440;

export default function App() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<PositionedNode[]>([]);
  const nodesRef = useRef<PositionedNode[]>([]);

  // какая ширина используется для "виртуальной" раскладки (обычно 1440)
  const layoutWidthRef = useRef<number | null>(null);
  // текущий сдвиг (чтобы центрировать виртуальную раскладку в реальном контейнере)
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string[]>(["all"]);
  const [selectedHolding, setSelectedHolding] = useState<HoldingNode | null>(
    null
  );
  const [resetZoomTrigger, _setResetZoomTrigger] = useState(0);
  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);

  // -----------------------
  // 1. СТАРТОВЫЙ ЛЭЙАУТ (в виртуальных координатах)
  // -----------------------
  const createInitial = (w: number, h: number) => {
    const res: PositionedNode[] = [];
    const r = DIAMETER / 2;

    // тут w — уже виртуальная ширина (не больше 1440)
    const effW = w;
    const xOffset = 0;

    const n = holdingsLevelOne.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);

    const availableW = Math.max(1, effW - 2 * (MARGIN + r));
    const availableH = Math.max(1, h - 2 * (MARGIN + r));
    const xStep = availableW / (cols + 1);
    const yStep = availableH / (rows + 1);

    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = xOffset + MARGIN + r + xStep * (col + 1);
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
  // 2. СИНХРОННАЯ РЕЛАКСАЦИЯ (в виртуальной области w × h)
  // -----------------------
  const relaxPositions = (
    srcList: PositionedNode[],
    w: number,
    h: number
  ): PositionedNode[] => {
    const r = DIAMETER / 2;
    const minDist = DIAMETER + GAP;

    const effW = w;
    const xOffset = 0;

    const list: PositionedNode[] = srcList.map((n) => ({ ...n }));

    let iteration = 0;
    const MAX_ITER = 120;
    const SPEED_THRESHOLD = 0.05;

    while (iteration < MAX_ITER) {
      let maxSpeed = 0;

      // силы отталкивания
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

      // интеграция
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

        const minX = xOffset + MARGIN + r;
        const maxX = xOffset + effW - MARGIN - r;
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
  // 3. ИНИЦИАЛИЗАЦИЯ + РЕСАЙЗ
  // -----------------------
  useLayoutEffect(() => {
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;

    // Виртуальная ширина раскладки (но не больше реальной — чтобы на узких экранах не вылезать)
    const layoutW = Math.min(LAYOUT_WIDTH, containerW);
    layoutWidthRef.current = layoutW;

    // Считаем раскладку в ВИРТУАЛЬНЫХ координатах [0..layoutW]
    const initialVirtual = createInitial(1360, 634);
    console.log("Initial virtual positions:", layoutW);
    const settledVirtual = relaxPositions(initialVirtual, 1360, 634);

    // Центрируем виртуальную область внутри реального контейнера
    const dx = (containerW - layoutW) / 2;
    const dy = 0; // если захочешь по вертикали центрировать — можно тоже что-то посчитать
    offsetRef.current = { dx, dy };

    const projected = settledVirtual.map((n) => ({
      ...n,
      cx: n.cx + dx,
      cy: n.cy + dy,
    }));

    nodesRef.current = projected;
    setNodes([...projected]);

    // При ресайзе НИЧЕГО заново не считаем, только сдвигаем всё целиком
    const ro = new ResizeObserver(() => {
      if (!boardRef.current || layoutWidthRef.current == null) return;

      const rect2 = boardRef.current.getBoundingClientRect();
      const newContainerW = rect2.width;
      const newContainerH = rect2.height;

      const layoutW2 = layoutWidthRef.current;

      // новый сдвиг, чтобы центрировать ту же виртуальную ширину
      const newDx = (newContainerW - layoutW2) / 2;
      const newDy = 0;

      const { dx: prevDx, dy: prevDy } = offsetRef.current;
      const ddx = newDx - prevDx;
      const ddy = newDy - prevDy;

      if (ddx !== 0 || ddy !== 0) {
        const shifted = nodesRef.current.map((n) => ({
          ...n,
          cx: n.cx + ddx,
          cy: n.cy + ddy,
        }));
        nodesRef.current = shifted;
        setNodes([...shifted]);
      }

      offsetRef.current = { newDx, newDy } as any; // маленький хак, чтобы не заводить новый тип
    });

    ro.observe(boardRef.current);

    return () => ro.disconnect();
  }, []);

  // -----------------------
  // 4. ПЕРЕРАЗМЕЩЕНИЕ ПРИ СМЕНЕ ФИЛЬТРОВ
  // -----------------------
  useEffect(() => {
    if (!boardRef.current) return;
    if (layoutWidthRef.current == null) return;

    const rect = boardRef.current.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;
    const layoutW = layoutWidthRef.current;

    const { dx, dy } = offsetRef.current;

    // переводим текущее состояние в виртуальные координаты (отнимаем сдвиг)
    const virtual = nodesRef.current.map((n) => ({
      ...n,
      cx: n.cx - dx,
      cy: n.cy - dy,
    }));

    // пересчитываем раскладку в виртуальной области
    const relaxedVirtual = relaxPositions(virtual, layoutW, containerH);

    // назад в реальные координаты
    const projected = relaxedVirtual.map((n) => ({
      ...n,
      cx: n.cx + dx,
      cy: n.cy + dy,
    }));

    nodesRef.current = projected;
    setNodes([...projected]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  // -----------------------
  // 5. ESC закрывает фильтр/модалку
  // -----------------------
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

  const activeSet = new Set(activeFilter);
  const filterOptions = baseOptions.map((opt) => ({
    ...opt,
    active: activeSet.has(opt.id),
  }));

  const handleToggleFilterOption = (id: string) => {
    setActiveFilter((prev) => {
      const s = new Set(prev);
      if (id === "all") return ["all"];

      s.delete("all");

      if (id === "warm") {
        if (s.has("warm")) s.delete("warm");
        else s.add("warm");
      } else if (id === "media" || id === "tg") {
        if (s.has(id)) s.delete(id);
        else {
          s.delete(id === "media" ? "tg" : "media");
          s.add(id);
        }
      } else {
        if (s.has(id)) s.delete(id);
        else s.add(id);
      }

      if (s.size === 0) return ["all"];
      return Array.from(s);
    });
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
            if (selectedHolding) {
              setSelectedHolding(null);
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
            if (!h) {
              setSelectedHolding(null);
              return;
            }
            if (selectedHolding && selectedHolding.id === h.id) {
              setSelectedHolding(null);
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
