import { useLayoutEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import {
  holdingsLevelOne,
  type HoldingNode,
  tgChannels,
  tgChannelNameMap,
} from "./data/holdings";
import { fixedMobilePositions, fixedPositions } from "./data/fixedPositions";
import type { PositionedNode } from "./types";
import { RadarBoard } from "./components/RadarBoard";
import { DetailsDrawer } from "./components/DetailsDrawer";
import { AppHeader } from "./components/AppHeader";
import { manualLayout } from "./data/manualLayout";

const DIAMETER_DESKTOP = 205;
const DIAMETER_MOBILE = 104;
const ZOOM_DIAMETER_DESKTOP_2 = 380;
const ZOOM_DIAMETER_DESKTOP_3 = 598;
const ZOOM_DIAMETER_MOBILE_2 = 246;
const ZOOM_DIAMETER_MOBILE_3 = 446;

const channelPlacementMap: Record<string, { nodeId: string; label: string }> =
  (() => {
    const map: Record<string, { nodeId: string; label: string }> = {};
    for (const [nodeId, items] of Object.entries(manualLayout)) {
      for (const item of items) {
        if (item.type !== "telegram") continue;
        const channelId = tgChannelNameMap[item.text];
        if (channelId && !map[channelId]) {
          map[channelId] = { nodeId, label: item.text };
        }
      }
    }
    return map;
  })();

export default function App() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<PositionedNode[]>([]);
  const nodesRef = useRef<PositionedNode[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOffsetX, setMobileOffsetX] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string[]>(["all"]);
  const [selectedHolding, setSelectedHolding] = useState<HoldingNode | null>(
    null
  );
  const [resetZoomTrigger, _setResetZoomTrigger] = useState(0);
  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [focusNodeTrigger, setFocusNodeTrigger] = useState(0);
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [highlightItemLabel, setHighlightItemLabel] = useState<string | null>(
    null
  );
  const [highlightChannelId, setHighlightChannelId] = useState<string | null>(
    null
  );

  const createInitial = (): PositionedNode[] => {
    const res: PositionedNode[] = [];
    for (const hnode of holdingsLevelOne) {
      const fixed = isMobile
        ? fixedMobilePositions[hnode.id]
        : fixedPositions[hnode.id];
      if (!fixed) continue;
      res.push({
        ...hnode,
        cx: fixed.cx + (isMobile ? mobileOffsetX : 0),
        cy: fixed.cy,
        vx: 0,
        vy: 0,
      });
    }
    return res;
  };

  useLayoutEffect(() => {
    const baseMobileWidth = 375;
    const check = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setMobileOffsetX(Math.max(0, (width - baseMobileWidth) / 2));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useLayoutEffect(() => {
    const initial = createInitial();
    nodesRef.current = initial;
    setNodes([...initial]);
  }, [isMobile, mobileOffsetX]);

  const baseOptions = [
    { id: "all", label: isMobile ? "СМИ и TG" : "СМИ и Telegram" },
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
      if (id === "all") {
        const res = ["all"];
        if (s.has("warm")) res.push("warm");
        return res;
      }
      if (id !== "warm") s.delete("all");
      if (id === "warm") {
        if (s.has("warm")) s.delete("warm");
        else s.add("warm");
      } else if (id === "media" || id === "tg") {
        const opposite = id === "media" ? "tg" : "media";
        if (s.has(id)) s.delete(id);
        else {
          s.delete(opposite);
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

  const handleSelectSearchResult = (
    id: string,
    type: "holding" | "channel"
  ) => {
    const source = type === "holding" ? holdingsLevelOne : tgChannels;
    const found =
      source.find((item) => item.id === id) ??
      [...holdingsLevelOne, ...tgChannels].find((item) => item.id === id);
    if (!found) return;

    setSelectedHolding(found);
    setHighlightItemLabel(null);
    setHighlightNodeId(null);
    setHighlightChannelId(null);

    if (type === "holding") {
      setFocusNodeId(found.id);
      setFocusNodeTrigger((t) => t + 1);
      setHighlightNodeId(found.id);
      return;
    }

    const placement = channelPlacementMap[id];
    const targetNodeId = placement?.nodeId ?? "tg-channels";
    setFocusNodeId(targetNodeId);
    setFocusNodeTrigger((t) => t + 1);
    setHighlightItemLabel(placement?.label ?? found.name);
    setHighlightChannelId(id);
  };

  return (
    <>
      <div
        className={`${styles["app"]} ${
          selectedHolding ? styles["app--modal-open"] : ""
        }`}
      >
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
          onSelectSearchResult={handleSelectSearchResult}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isMobile={isMobile}
        />

        <RadarBoard
          isMobile={isMobile}
          nodes={nodes}
          diameter={isMobile ? DIAMETER_MOBILE : DIAMETER_DESKTOP}
          diameters={{
            level1: isMobile ? DIAMETER_MOBILE : DIAMETER_DESKTOP,
            level2: isMobile ? ZOOM_DIAMETER_MOBILE_2 : ZOOM_DIAMETER_DESKTOP_2,
            level3: isMobile ? ZOOM_DIAMETER_MOBILE_3 : ZOOM_DIAMETER_DESKTOP_3,
          }}
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
          focusNodeId={focusNodeId}
          focusNodeTrigger={focusNodeTrigger}
          highlightNodeId={highlightNodeId}
          highlightItemLabel={highlightItemLabel}
          highlightChannelId={highlightChannelId}
        />
      </div>
      <DetailsDrawer
        holding={selectedHolding}
        onClose={() => {
          setSelectedHolding(null);
          if (!isMobile) {
            _setResetZoomTrigger((t) => t + 1);
          }
        }}
      />
    </>
  );
}
