import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import type { FileNode } from "@/lib/types";

// Only skip system/build artifacts that are never useful to visualize
const IGNORED = new Set([
  "node_modules",
  ".git",
  ".next",
  ".DS_Store",
  "__pycache__",
  ".Trash",
  ".Spotlight-V100",
  ".fseventsd",
  ".DocumentRevisions-V100",
  ".TemporaryItems",
  ".vol",
]);

// macOS APFS firmlinks: /System/Volumes/Data mirrors user data that's already
// accessible via firmlinks at the root level (/Users, /Library, /Applications, etc.)
// Scanning both would double-count all user data. Skip the Data volume and other
// special APFS volumes when encountered.
const APFS_SKIP_VOLUMES = new Set([
  "Data",
  "BaseSystem",
  "Recovery",
  "Preboot",
  "VM",
  "Update",
  "FieldService",
  "FieldServiceDiagnostic",
  "FieldServiceRepair",
  "Hardware",
  "iSCPreboot",
  "xarts",
]);

// Directories macOS hides via UF_HIDDEN flag (not dot-prefixed)
const MACOS_HIDDEN_DIRS = new Set(["Library"]);

function isHidden(entryName: string, parentPath: string): boolean {
  if (entryName.startsWith(".")) return true;

  // ~/Library is hidden by macOS via UF_HIDDEN flag
  if (MACOS_HIDDEN_DIRS.has(entryName)) {
    const parent = path.basename(parentPath);
    const grandparent = path.basename(path.dirname(parentPath));
    // Only mark as hidden if it's a user's Library (under /Users/*)
    if (grandparent === "Users" || parent === "Users") return true;
  }

  return false;
}

function scanDirectory(
  dirPath: string,
  depth: number,
  maxDepth: number
): FileNode {
  const name = path.basename(dirPath) || dirPath;
  const node: FileNode = { name, size: 0, path: dirPath, children: [] };

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return node;
  }

  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);

    // Skip APFS firmlink volumes to avoid double-counting
    if (dirPath === "/System/Volumes" && APFS_SKIP_VOLUMES.has(entry.name)) {
      continue;
    }

    try {
      if (entry.isSymbolicLink()) continue;

      const hidden = isHidden(entry.name, dirPath);

      if (entry.isDirectory()) {
        if (depth < maxDepth) {
          const child = scanDirectory(fullPath, depth + 1, maxDepth);
          if (child.size > 0) {
            child.hidden = hidden;
            node.children!.push(child);
            node.size += child.size;
          }
        } else {
          const dirSize = getDirSize(fullPath);
          if (dirSize > 0) {
            node.children!.push({
              name: entry.name,
              size: dirSize,
              path: fullPath,
              hidden,
            });
            node.size += dirSize;
          }
        }
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        // Use blocks * 512 for actual disk usage (handles sparse files like Docker.raw)
        const realSize = stat.blocks * 512;
        node.size += realSize;
        node.children!.push({
          name: entry.name,
          size: realSize,
          path: fullPath,
          hidden,
        });
      }
    } catch {
      continue;
    }
  }

  node.children!.sort((a, b) => b.size - a.size);

  // Collapse tiny items into "other" if there are many
  if (node.children!.length > 20) {
    const top = node.children!.slice(0, 15);
    const rest = node.children!.slice(15);
    const otherSize = rest.reduce((sum, c) => sum + c.size, 0);
    if (otherSize > 0) {
      top.push({
        name: `(${rest.length} other items)`,
        size: otherSize,
        path: dirPath,
      });
    }
    node.children = top;
  }

  return node;
}

function getDirSize(dirPath: string): number {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED.has(entry.name)) continue;
      if (dirPath === "/System/Volumes" && APFS_SKIP_VOLUMES.has(entry.name)) continue;
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isSymbolicLink()) continue;
        if (entry.isFile()) {
          const stat = fs.statSync(fullPath);
          size += stat.blocks * 512;
        } else if (entry.isDirectory()) {
          size += getDirSize(fullPath);
        }
      } catch {
        continue;
      }
    }
  } catch {
    // ignore permission errors
  }
  return size;
}

function countFiles(node: FileNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + countFiles(c), 0);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dirPath = searchParams.get("path") || process.env.HOME || "/";
  const maxDepth = parseInt(searchParams.get("depth") || "4", 10);

  const resolved = path.resolve(dirPath);

  if (!fs.existsSync(resolved)) {
    return NextResponse.json(
      { error: `Path not found: ${resolved}` },
      { status: 400 }
    );
  }

  const start = performance.now();
  const root = scanDirectory(resolved, 0, maxDepth);
  const scanDuration = performance.now() - start;
  const fileCount = countFiles(root);

  return NextResponse.json({
    root,
    totalSize: root.size,
    fileCount,
    scanDuration: Math.round(scanDuration),
  });
}
