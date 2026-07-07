import { NextRequest, NextResponse } from "next/server";

// Bulk-create the reviewed tickets.
export const maxDuration = 120;

export const POST = async (req: NextRequest) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/srs/generate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to create tickets" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error creating SRS tickets:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
};
