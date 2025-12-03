import type { HoldingNode } from "./data/holdings";

export type ContentItem = {
  id: string;
  text: string;
  type: "name" | "asset" | "telegram";
  angle?: number;
  radius?: number;
  fontSize?: number; // px
  maxWidth?: number; // px
};

export type PositionedNode = HoldingNode & {
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  contentItems?: ContentItem[];
};
