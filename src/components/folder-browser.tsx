"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FolderOpen,
  ChevronUp,
  Home,
  X,
  Check,
  Loader2,
} from "lucide-react";

interface BrowseEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface BrowseResult {
  current: string;
  parent: string;
  entries: BrowseEntry[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export function FolderBrowser({ open, onClose, onSelect }: Props) {
  const [browsePath, setBrowsePath] = useState("~");
  const [browseData, setBrowseData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(false);

  const browse = useCallback(async (dir: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/browse?path=${encodeURIComponent(dir)}`
      );
      const data = await res.json();
      if (res.ok) {
        setBrowseData(data);
        setBrowsePath(data.current);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) browse("~");
  }, [open, browse]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-lg mx-4 bg-[var(--color-hull)] border border-[var(--color-ridge)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-ridge)]">
          <FolderOpen size={16} className="text-[var(--color-teal-4)]" />
          <h2 className="text-sm font-[var(--font-display)] font-semibold text-[var(--color-white)]">
            Browse Folders
          </h2>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--color-ridge)] text-[var(--color-muted)] hover:text-[var(--color-bright)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current path */}
        <div className="px-4 py-2 border-b border-[var(--color-ridge)] bg-[var(--color-panel)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-[var(--font-display)] text-[var(--color-dim)] truncate flex-1">
              {browsePath}
            </span>
            {loading && (
              <Loader2
                size={12}
                className="animate-spin text-[var(--color-teal-4)]"
              />
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--color-ridge)]">
          <button
            onClick={() => browse("~")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-[var(--font-display)]
              text-[var(--color-dim)] hover:text-[var(--color-bright)] hover:bg-[var(--color-ridge)] transition-colors"
          >
            <Home size={12} />
            Home
          </button>
          <button
            onClick={() => browse("/")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-[var(--font-display)]
              text-[var(--color-dim)] hover:text-[var(--color-bright)] hover:bg-[var(--color-ridge)] transition-colors"
          >
            Root
          </button>
          {browseData && browseData.parent !== browseData.current && (
            <button
              onClick={() => browse(browseData.parent)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-[var(--font-display)]
                text-[var(--color-dim)] hover:text-[var(--color-bright)] hover:bg-[var(--color-ridge)] transition-colors"
            >
              <ChevronUp size={12} />
              Up
            </button>
          )}
        </div>

        {/* Directory listing */}
        <div className="max-h-80 overflow-y-auto">
          {browseData?.entries.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-[var(--color-muted)] font-[var(--font-display)]">
              No subdirectories
            </div>
          )}
          {browseData?.entries.map((entry) => (
            <button
              key={entry.path}
              onClick={() => browse(entry.path)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left
                hover:bg-[var(--color-panel)] transition-colors group"
            >
              <Folder
                size={14}
                className={`shrink-0 ${
                  entry.name.startsWith(".")
                    ? "text-[var(--color-muted)]"
                    : "text-[var(--color-teal-3)]"
                }`}
              />
              <span
                className={`text-xs font-[var(--font-display)] truncate ${
                  entry.name.startsWith(".")
                    ? "text-[var(--color-muted)]"
                    : "text-[var(--color-bright)]"
                }`}
              >
                {entry.name}
              </span>
            </button>
          ))}
        </div>

        {/* Footer with select button */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-ridge)] bg-[var(--color-panel)]">
          <span className="text-xs font-[var(--font-display)] text-[var(--color-muted)] flex-1 truncate">
            Select current folder or navigate deeper
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-[var(--font-display)] font-medium
              text-[var(--color-dim)] hover:text-[var(--color-bright)] border border-[var(--color-ridge)]
              hover:bg-[var(--color-ridge)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSelect(browsePath);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-[var(--font-display)] font-semibold
              bg-[var(--color-teal-3)] hover:bg-[var(--color-teal-4)] text-[var(--color-void)] transition-colors"
          >
            <Check size={12} />
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
