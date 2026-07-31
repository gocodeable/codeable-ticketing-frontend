import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/api/backend";

// Bulk-create the reviewed tickets (fast — no model call).
export const maxDuration = 120;

export const POST = async (req: NextRequest) => {
  const idToken = req.headers.get("Authorization")?.split(" ")[1];
  if (!idToken) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const result = await readJson("/api/v1/srs/generate", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    console.error("SRS ticket creation failed:", result.status, result.error);
    return NextResponse.json(
      { success: false, error: result.error || "Failed to create tickets" },
      { status: result.status }
    );
  }
  return NextResponse.json({ success: true, data: result.data });
};
