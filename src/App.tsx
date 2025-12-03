import { useLayoutEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import { holdingsLevelOne, type HoldingNode, tgChannels } from "./data/holdings";
import { fixedPositions } from "./data/fixedPositions";
import type { PositionedNode } from "./types";
import { RadarBoard } from "./components/RadarBoard";
import { DetailsDrawer } from "./components/DetailsDrawer";
import { AppHeader } from "./components/AppHeader";

const DIAMETER = 205;

export default function App() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<PositionedNode[]>([]);
  const nodesRef = useRef<PositionedNode[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string[]>(["all"]);
  const [selectedHolding, setSelectedHolding] = useState<HoldingNode | null>(null);
  const [resetZoomTrigger, _setResetZoomTrigger] = useState(0);
  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);

  const createInitial = (): PositionedNode[] => {
    const res: PositionedNode[] = [];
    for (const hnode of holdingsLevelOne) {
      const fixed = fixedPositions[hnode.id];
      if (!fixed) continue;
      res.push({ ...hnode, cx: fixed.cx, cy: fixed.cy, vx: 0, vy: 0 });
    }
    return res;
  };

  useLayoutEffect(() => {
    const initial = createInitial();
    nodesRef.current = initial;
    setNodes([...initial]);
  }, []);

  const baseOptions = [
    { id: "all", label: "СМИ и Telegram" },
    { id: "private", label: "Частные" },
    { id: "warm", label: "Тёплый контакт" },
    { id: "media", label: "СМИ" },
    { id: "tg", label: "Telegram" },
  ];

  const activeSet = new Set(activeFilter);
  const filterOptions = baseOptions.map((opt) => ({ ...opt, active: activeSet.has(opt.id) }));

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
