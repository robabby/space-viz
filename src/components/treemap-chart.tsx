"use client";

import { useMemo } from "react";
import { Treemap, ResponsiveContainer } from "recharts";
import type { FileNode } from "@/lib/types";
import { formatBytes, formatPercent } from "@/lib/format";

interface Props {
  data: FileNode;
  onNavigate: (node: FileNode) => void;
}

const COLORS = [
  "#0d3b3e",
  "#115555",
  "#146b6d",
  "#178585",
  "#1a9e9e",
  "#22b8b8",
  "#2dd4bf",
  "#1e6e5e",
  "#0f4a4a",
  "#1b7a6e",
  "#138888",
  "#169c8a",
  "#20b0a0",
  "#28c4b0",
  "#35d8c4",
  "#4ae4d0",
];

interface TreemapItem {
  name: string;
  size: number;
  color: string;
  node: FileNode;
  children?: TreemapItem[];
}

function mapData(node: FileNode): TreemapItem[] {
  if (!node.children || node.children.length === 0) return [];
  return node.children.map((child, i) => ({
    name: child.name,
    size: child.size,
    color: COLORS[i % COLORS.length],
    node: child,
    ...(child.children && child.children.length > 0
      ? { children: mapData(child) }
      : {}),
  }));
}

function CustomContent(props: Record<string, unknown>) {
  const {
    x,
    y,
    width,
    height,
    name,
    size,
    color,
    node,
    root,
    onNavigate: nav,
  } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    size: number;
    color: string;
    node: FileNode;
    root: { value: number };
    onNavigate: (n: FileNode) => void;
  };

  if (width < 4 || height < 4) return null;

  const hasChildren = node?.children && node.children.length > 0;
  const totalSize = root?.value ?? 1;
  const showLabel = width > 60 && height > 36;
  const showSize = width > 80 && height > 52;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#0a0e14"
        strokeWidth={2}
        rx={3}
        style={{
          cursor: hasChildren ? "pointer" : "default",
          transition: "opacity 150ms ease",
        }}
        onMouseEnter={(e) => {
          (e.target as SVGRectElement).style.opacity = "0.75";
        }}
        onMouseLeave={(e) => {
          (e.target as SVGRectElement).style.opacity = "1";
        }}
        onClick={() => {
          if (hasChildren && nav) nav(node);
        }}
      />
      {showLabel && (
        <text
          x={x + 8}
          y={y + 18}
          fill="#edf2f7"
          fontSize={12}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={500}
          style={{ pointerEvents: "none" }}
        >
          {name.length > Math.floor(width / 8)
            ? name.slice(0, Math.floor(width / 8) - 1) + "\u2026"
            : name}
        </text>
      )}
      {showSize && (
        <text
          x={x + 8}
          y={y + 34}
          fill="#8694a8"
          fontSize={10}
          fontFamily="'JetBrains Mono', monospace"
          style={{ pointerEvents: "none" }}
        >
          {formatBytes(size)} ({formatPercent(size, totalSize)})
        </text>
      )}
    </g>
  );
}

export function TreemapChart({ data, onNavigate }: Props) {
  const treeData = useMemo(() => mapData(data), [data]);

  return (
    <div className="w-full" style={{ height: 520 }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treeData}
          dataKey="size"
          nameKey="name"
          content={
            <CustomContent
              onNavigate={onNavigate}
              x={0}
              y={0}
              width={0}
              height={0}
              name=""
              size={0}
              color=""
              node={data}
              root={{ value: data.size }}
            />
          }
          isAnimationActive={false}
        />
      </ResponsiveContainer>
    </div>
  );
}
