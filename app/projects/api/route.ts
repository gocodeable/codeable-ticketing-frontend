import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");
    const limit = searchParams.get("limit");
    const skip = searchParams.get("skip");

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const idToken = request.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Build URL with pagination params
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (skip) params.append("skip", skip);
    const queryString = params.toString();
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/user/${uid}${queryString ? `?${queryString}` : ""}`;
    
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
          error: data.message || "Failed to fetch projects",
        },
        { status: response.status }
      );
    }
    return NextResponse.json({ 
      success: true, 
      data: data.data,
      pagination: data.pagination 
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
