import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const projectId = searchParams.get("projectId");
    const limit = searchParams.get("limit");
    const skip = searchParams.get("skip");
    const table = searchParams.get("table");
    
    if (!projectId || projectId === "null" || projectId === "undefined") {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }
    
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Build URL with pagination params only
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (skip) params.append("skip", skip);
    if (table) params.append("table", table);
    const queryString = params.toString();
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/issues/project/${projectId}${queryString ? `?${queryString}` : ""}`;
    
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
          error: data.message || "Failed to fetch issues",
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
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/issues`;
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Failed to create issue",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};

