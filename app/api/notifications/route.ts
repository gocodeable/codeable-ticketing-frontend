import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const limit = searchParams.get("limit") || "50";
    const skip = searchParams.get("skip") || "0";
    const unreadOnly = searchParams.get("unreadOnly") || "false";
    
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (skip) params.append("skip", skip);
    if (unreadOnly) params.append("unreadOnly", unreadOnly);
    const queryString = params.toString();
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications${queryString ? `?${queryString}` : ""}`;
    
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Failed to fetch notifications",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: data.data,
      unreadCount: data.unreadCount 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};

