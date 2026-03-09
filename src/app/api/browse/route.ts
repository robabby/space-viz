import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface BrowseEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dirPath = searchParams.get("path") || os.homedir();

  const resolved = dirPath === "~" ? os.homedir() : path.resolve(dirPath);

  if (!fs.existsSync(resolved)) {
    return NextResponse.json(
      { error: `Path not found: ${resolved}` },
      { status: 400 }
    );
  }

  try {
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const dirs: BrowseEntry[] = [];

    for (const entry of entries) {
      // Skip non-directories and system files
      if (!entry.isDirectory()) continue;
      if (entry.name === ".DS_Store") continue;

      const fullPath = path.join(resolved, entry.name);
      dirs.push({
        name: entry.name,
        path: fullPath,
        isDirectory: true,
      });
    }

    // Sort: non-hidden first, then alphabetically
    dirs.sort((a, b) => {
      const aHidden = a.name.startsWith(".");
      const bHidden = b.name.startsWith(".");
      if (aHidden !== bHidden) return aHidden ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      current: resolved,
      parent: path.dirname(resolved),
      entries: dirs,
    });
  } catch {
    return NextResponse.json(
      { error: "Cannot read directory" },
      { status: 403 }
    );
  }
}
