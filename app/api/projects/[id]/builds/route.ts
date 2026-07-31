import { NextRequest, NextResponse } from "next/server";

// Add a named build/dashboard to a project. The backend validates the link
// and enforces who may add one (admin, PM, QA).
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { name, platform, url, note } = await req.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${id}/builds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, platform, url, note }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to add build" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error adding build:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};
