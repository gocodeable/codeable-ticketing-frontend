import { NextRequest, NextResponse } from "next/server";

export const PATCH = async (req: NextRequest) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/read-all`;
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Failed to mark all notifications as read",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};

