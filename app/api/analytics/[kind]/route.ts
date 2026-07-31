import { NextRequest, NextResponse } from "next/server";

// Velocity analytics proxy. kind in velocity | flow | reliability | team.
// The backend gates all of these to the feature-admin allowlist.
const KINDS = new Set(["velocity", "flow", "reliability", "team"]);

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) => {
  try {
    const { kind } = await params;
    if (!KINDS.has(kind)) {
      return NextResponse.json({ success: false, error: "Unknown analytics endpoint" }, { status: 404 });
    }
    const searchParams = new URL(req.url).searchParams;
    const projectId = searchParams.get("projectId");
    if (!projectId || projectId === "null" || projectId === "undefined") {
      return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 });
    }
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const query = new URLSearchParams();
    for (const key of ["from", "to", "interval", "assignee", "staleDays"]) {
      const value = searchParams.get(key);
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/project/${projectId}/${kind}${qs ? `?${qs}` : ""}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to load analytics" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error loading analytics:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
};
