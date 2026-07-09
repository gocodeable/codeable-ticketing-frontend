import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/api/backend";

// Starts an SRS generation. The backend answers 202 { jobId } immediately and
// runs the model in the background — nothing here waits minutes for a result,
// so no proxy (Cloudflare caps at ~100s) can kill it. Poll /api/srs/preview/[jobId].
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

  const result = await readJson("/api/v1/srs/preview", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    console.error("SRS preview start failed:", result.status, result.error);
    return NextResponse.json(
      { success: false, error: result.error || "Failed to start generation" },
      { status: result.status }
    );
  }
  return NextResponse.json({ success: true, data: result.data });
};
