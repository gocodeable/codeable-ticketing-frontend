import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/api/backend";

// Poll a generation started by POST /api/srs/preview.
// Returns { status: 'pending' | 'done' | 'error', ... }.
export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) => {
  const { jobId } = await params;
  const idToken = req.headers.get("Authorization")?.split(" ")[1];
  if (!idToken) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await readJson(`/api/v1/srs/preview/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error || "Failed to read generation status" },
      { status: result.status }
    );
  }
  return NextResponse.json({ success: true, data: result.data });
};
