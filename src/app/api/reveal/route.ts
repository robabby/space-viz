import { NextRequest, NextResponse } from "next/server";
import { execSync } from "node:child_process";
import fs from "node:fs";

export async function POST(request: NextRequest) {
  const { path: filePath } = await request.json();

  if (!filePath || typeof filePath !== "string") {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  try {
    execSync(`open -R "${filePath}"`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to reveal" }, { status: 500 });
  }
}
