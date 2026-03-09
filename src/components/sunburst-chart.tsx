"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import * as d3Hierarchy from "d3-hierarchy";
import * as d3Shape from "d3-shape";
import * as d3Interpolate from "d3-interpolate";
import * as d3Scale from "d3-scale";
import type { FileNode } from "@/lib/types";
import { formatBytes, formatPercent } from "@/lib/format";

interface Props {
  data: FileNode;
  onNavigate: (node: FileNode) => void;
}

type HierarchyNode = d3Hierarchy.HierarchyRectangularNode<FileNode>;

const TEAL_RANGE = [
  "#0d3b3e",
  "#115555",
  "#146b6d",
  "#178585",
  "#1a9e9e",
  "#22b8b8",
  "#2dd4bf",
  "#5eead4",
];

export function SunburstChart({ data, onNavigate }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const size = 560;
  const radius = size / 2;
  const innerRadius = radius * 0.15;

  const render = useCallback(() => {
    if (!svgRef.current) return;

    const root = d3Hierarchy
      .hierarchy(data)
      .sum((d) => (d.children ? 0 : d.size))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const partition = d3Hierarchy.partition<FileNode>().size([2 * Math.PI, radius - innerRadius]);
    partition(root);

    const colorScale = d3Scale
      .scaleOrdinal<string>()
      .domain(root.children?.map((_, i) => String(i)) ?? [])
      .range(TEAL_RANGE);

    const arc = d3Shape
      .arc<HierarchyNode>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0 + innerRadius)
      .outerRadius((d) => d.y1 + innerRadius - 1)
      .padAngle(0.004)
      .padRadius(radius / 2);

    const svg = svgRef.current;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${radius},${radius})`);
    svg.appendChild(g);

    const nodes = root.descendants().filter((d) => d.depth > 0);

    for (const node of nodes) {
      const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");

      const topAncestor = node.ancestors().find((a) => a.depth === 1);
      const topIndex = topAncestor
        ? root.children?.indexOf(topAncestor) ?? 0
        : 0;
      const baseColor = colorScale(String(topIndex));

      const depthFactor = 1 - (node.depth - 1) * 0.15;
      const color = d3Interpolate.interpolateRgb(baseColor, "#0a0e14")(
        1 - depthFactor
      );

      pathEl.setAttribute("d", arc(node as HierarchyNode) || "");
      pathEl.setAttribute("fill", color);
      pathEl.setAttribute("stroke", "#0a0e14");
      pathEl.setAttribute("stroke-width", "0.5");
      pathEl.style.cursor = node.children ? "pointer" : "default";
      pathEl.style.transition = "opacity 150ms ease";

      pathEl.addEventListener("mouseenter", (e) => {
        pathEl.style.opacity = "0.8";
        setHoveredPath(node.data.path);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "block";
          tooltipRef.current.innerHTML = `
            <div style="color: #5eead4; margin-bottom: 2px;">${node.data.name}</div>
            <div>${formatBytes(node.value ?? 0)} <span style="color: #4a5568;">|</span> ${formatPercent(node.value ?? 0, root.value ?? 1)}</div>
          `;
        }
      });

      pathEl.addEventListener("mousemove", (e) => {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = `${e.clientX + 12}px`;
          tooltipRef.current.style.top = `${e.clientY - 10}px`;
        }
      });

      pathEl.addEventListener("mouseleave", () => {
        pathEl.style.opacity = "1";
        setHoveredPath(null);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      });

      if (node.children) {
        pathEl.addEventListener("click", () => {
          onNavigate(node.data);
        });
      }

      g.appendChild(pathEl);
    }

    // Center label
    const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerText.setAttribute("text-anchor", "middle");
    centerText.setAttribute("dy", "-0.3em");
    centerText.setAttribute("fill", "#8694a8");
    centerText.setAttribute("font-family", "'JetBrains Mono', monospace");
    centerText.setAttribute("font-size", "11");
    centerText.textContent = "TOTAL";
    g.appendChild(centerText);

    const sizeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    sizeText.setAttribute("text-anchor", "middle");
    sizeText.setAttribute("dy", "1.2em");
    sizeText.setAttribute("fill", "#edf2f7");
    sizeText.setAttribute("font-family", "'JetBrains Mono', monospace");
    sizeText.setAttribute("font-size", "16");
    sizeText.setAttribute("font-weight", "700");
    sizeText.textContent = formatBytes(root.value ?? 0);
    g.appendChild(sizeText);
  }, [data, onNavigate, radius, innerRadius]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-full h-auto"
      />
      <div ref={tooltipRef} className="sunburst-tooltip" style={{ display: "none" }} />
    </div>
  );
}
