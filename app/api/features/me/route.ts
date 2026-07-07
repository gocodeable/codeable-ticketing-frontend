import { NextRequest, NextResponse } from "next/server";

// Proxies to the ticketing backend feature-gate endpoint. Drives the
// sidebar and the gated pages.
export const GET = async (req: NextRequest) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/features/me`,
      { method: "GET", headers: { Authorization: `Bearer ${idToken}` } }
    );
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to resolve features" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error resolving features:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};
