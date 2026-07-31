import { NextRequest, NextResponse } from "next/server";

// Feature-grant management (feature admins only; backend enforces it).
export const GET = async (req: NextRequest) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/features/grants`,
      { method: "GET", headers: { Authorization: `Bearer ${idToken}` } }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to list grants" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error listing grants:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/features/grants`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to grant access" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error granting access:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
};
