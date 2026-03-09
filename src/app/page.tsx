"use client";

import { useState, useCallback } from "react";
import {
  Search,
  ChevronRight,
  Disc3,
  LayoutGrid,
  Loader2,
  FolderOpen,
  FolderSearch,
  HardDrive,
  Clock,
  Files,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { SunburstChart } from "@/components/sunburst-chart";
import { TreemapChart } from "@/components/treemap-chart";
import { FolderBrowser } from "@/components/folder-browser";
import { formatBytes } from "@/lib/format";
import type { FileNode, ScanResult } from "@/lib/types";

type ViewMode = "sunburst" | "treemap";

export default function Home() {
  const [path, setPath] = useState("~");
  const [depth, setDepth] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("sunburst");
  const [breadcrumbs, setBreadcrumbs] = useState<FileNode[]>([]);
  const [browserOpen, setBrowserOpen] = useState(false);

  const currentData =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : result?.root;

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBreadcrumbs([]);
    try {
      const res = await fetch(
        `/api/scan?path=${encodeURIComponent(path)}&depth=${depth}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Scan failed");
        return;
      }
      setResult(data);
      // Show the resolved path the server actually scanned
      if (data.root?.path) setPath(data.root.path);
    } catch (e) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [path, depth]);

  const handleNavigate = useCallback(
    (node: FileNode) => {
      if (!node.children || node.children.length === 0) return;
      setBreadcrumbs((prev) => [...prev, node]);
    },
    []
  );

  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      if (index === -1) {
        setBreadcrumbs([]);
      } else {
        setBreadcrumbs((prev) => prev.slice(0, index + 1));
      }
    },
    []
  );

  const handleReveal = useCallback(async (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath }),
      });
    } catch {
      // silently fail
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--color-ridge)] bg-[var(--color-hull)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <HardDrive size={20} className="text-[var(--color-teal-4)]" />
            <h1 className="font-[var(--font-display)] text-base font-bold tracking-tight text-[var(--color-white)]">
              SPACE VIZ
            </h1>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-[var(--color-muted)] font-[var(--font-display)]">
            disk space explorer
          </span>
        </div>
      </header>

      {/* Controls */}
      <div className="border-b border-[var(--color-ridge)] bg-[var(--color-hull)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scan()}
                placeholder="Enter directory path..."
                className="w-full bg-[var(--color-panel)] border border-[var(--color-ridge)] rounded-lg pl-4 pr-12 py-2.5
                  text-sm font-[var(--font-display)] text-[var(--color-bright)]
                  placeholder:text-[var(--color-muted)]
                  focus:outline-none focus:border-[var(--color-teal-3)] focus:ring-1 focus:ring-[var(--color-teal-3)]
                  transition-colors"
              />
              <button
                onClick={() => setBrowserOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md
                  text-[var(--color-muted)] hover:text-[var(--color-teal-4)] hover:bg-[var(--color-ridge)]
                  transition-colors"
                title="Browse folders"
              >
                <FolderSearch size={16} />
              </button>
            </div>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="bg-[var(--color-panel)] border border-[var(--color-ridge)] rounded-lg px-3 py-2.5
                text-sm font-[var(--font-display)] text-[var(--color-dim)]
                focus:outline-none focus:border-[var(--color-teal-3)]
                transition-colors appearance-none cursor-pointer"
            >
              {[2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>
                  {d} levels
                </option>
              ))}
            </select>
            <button
              onClick={scan}
              disabled={loading}
              className="flex items-center gap-2 bg-[var(--color-teal-3)] hover:bg-[var(--color-teal-4)]
                disabled:opacity-50 disabled:cursor-not-allowed
                text-[var(--color-void)] font-[var(--font-display)] text-sm font-semibold
                px-5 py-2.5 rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Scan
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-[var(--color-rose)] font-[var(--font-display)]">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <HardDrive
              size={48}
              className="text-[var(--color-ridge)] mb-4"
            />
            <p className="text-[var(--color-dim)] font-[var(--font-display)] text-sm">
              Enter a directory path and hit Scan
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-1">
              Use ~ for home directory
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2
              size={32}
              className="animate-spin text-[var(--color-teal-4)] mb-3"
            />
            <p className="text-[var(--color-dim)] font-[var(--font-display)] text-sm">
              Scanning filesystem...
            </p>
          </div>
        )}

        {result && !loading && currentData && (
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Stats bar */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-xs font-[var(--font-display)] text-[var(--color-dim)]">
                <HardDrive size={13} className="text-[var(--color-teal-3)]" />
                {formatBytes(result.totalSize)}
              </div>
              <div className="flex items-center gap-2 text-xs font-[var(--font-display)] text-[var(--color-dim)]">
                <Files size={13} className="text-[var(--color-teal-3)]" />
                {result.fileCount.toLocaleString()} items
              </div>
              <div className="flex items-center gap-2 text-xs font-[var(--font-display)] text-[var(--color-dim)]">
                <Clock size={13} className="text-[var(--color-teal-3)]" />
                {result.scanDuration}ms
              </div>

              <div className="flex-1" />

              {/* View toggle */}
              <div className="flex items-center bg-[var(--color-hull)] border border-[var(--color-ridge)] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("sunburst")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-[var(--font-display)] transition-colors ${
                    viewMode === "sunburst"
                      ? "bg-[var(--color-teal-1)] text-[var(--color-teal-4)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-dim)]"
                  }`}
                >
                  <Disc3 size={13} />
                  Sunburst
                </button>
                <button
                  onClick={() => setViewMode("treemap")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-[var(--font-display)] transition-colors ${
                    viewMode === "treemap"
                      ? "bg-[var(--color-teal-1)] text-[var(--color-teal-4)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-dim)]"
                  }`}
                >
                  <LayoutGrid size={13} />
                  Treemap
                </button>
              </div>
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 mb-4 text-xs font-[var(--font-display)]">
                <button
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="text-[var(--color-teal-4)] hover:text-[var(--color-teal-5)] transition-colors"
                >
                  {result.root.name}
                </button>
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight
                      size={12}
                      className="text-[var(--color-muted)]"
                    />
                    <button
                      onClick={() => handleBreadcrumbClick(i)}
                      className={`transition-colors ${
                        i === breadcrumbs.length - 1
                          ? "text-[var(--color-bright)]"
                          : "text-[var(--color-teal-4)] hover:text-[var(--color-teal-5)]"
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Chart */}
            <div className="bg-[var(--color-hull)] border border-[var(--color-ridge)] rounded-xl p-6">
              {viewMode === "sunburst" ? (
                <SunburstChart
                  data={currentData}
                  onNavigate={handleNavigate}
                />
              ) : (
                <TreemapChart
                  data={currentData}
                  onNavigate={handleNavigate}
                />
              )}
            </div>

            {/* Top folders table */}
            {currentData.children && currentData.children.length > 0 && (
              <div className="mt-6 bg-[var(--color-hull)] border border-[var(--color-ridge)] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--color-ridge)]">
                  <h2 className="text-xs font-[var(--font-display)] font-semibold text-[var(--color-dim)] uppercase tracking-wider">
                    Contents
                  </h2>
                </div>
                <div className="divide-y divide-[var(--color-ridge)]">
                  {currentData.children.map((child, i) => {
                    const pct =
                      currentData.size > 0
                        ? (child.size / currentData.size) * 100
                        : 0;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                          child.children
                            ? "cursor-pointer hover:bg-[var(--color-panel)] transition-colors"
                            : ""
                        }`}
                        onClick={() =>
                          child.children && handleNavigate(child)
                        }
                      >
                        <div className="w-5 text-center">
                          {child.children ? (
                            <FolderOpen
                              size={14}
                              className="text-[var(--color-teal-3)]"
                            />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-[var(--color-ridge)] mx-auto" />
                          )}
                        </div>
                        <span className="flex-1 font-[var(--font-display)] text-xs text-[var(--color-bright)] truncate flex items-center gap-2">
                          {child.name}
                          {child.hidden && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-ridge)] text-[10px] text-[var(--color-muted)] shrink-0" title="Hidden in Finder — use Cmd+Shift+. to reveal">
                              <EyeOff size={9} />
                              hidden
                            </span>
                          )}
                        </span>
                        <button
                          onClick={(e) => handleReveal(child.path, e)}
                          className="p-1 rounded hover:bg-[var(--color-ridge)] text-[var(--color-muted)] hover:text-[var(--color-teal-4)] transition-colors shrink-0"
                          title="Reveal in Finder"
                        >
                          <ExternalLink size={12} />
                        </button>
                        <div className="w-32 h-1.5 bg-[var(--color-panel)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-teal-3)] rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 0.5)}%` }}
                          />
                        </div>
                        <span className="w-20 text-right font-[var(--font-display)] text-xs text-[var(--color-dim)]">
                          {formatBytes(child.size)}
                        </span>
                        <span className="w-14 text-right font-[var(--font-display)] text-xs text-[var(--color-muted)]">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <FolderBrowser
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        onSelect={(selectedPath) => setPath(selectedPath)}
      />
    </div>
  );
}
