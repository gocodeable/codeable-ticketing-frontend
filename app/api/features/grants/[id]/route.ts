import { NextRequest, NextResponse } from "next/server";

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/features/grants/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${idToken}` } }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to revoke access" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error revoking access:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
};
