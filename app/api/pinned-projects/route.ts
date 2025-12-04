import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const idToken = request.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pinned-projects`;
    const response = await fetch(backendUrl, {
      method: "GET",
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
          error: data.message || "Failed to fetch pinned projects",
        },
        { status: response.status }
      );
    }

    // Extract projects from the pinned projects data
    const pinnedProjects = data.data?.map((pinnedItem: any) => pinnedItem.project) || [];

    return NextResponse.json({ success: true, data: pinnedProjects });
  } catch (error) {
    console.error("Error fetching pinned projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

