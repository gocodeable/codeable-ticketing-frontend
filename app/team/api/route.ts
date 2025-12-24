import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get("id");
    
    if (!id || id === "null" || id === "undefined") {
      return NextResponse.json(
        { success: false, error: "Team ID is required" },
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

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/teams/${id}`;
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
          error: data.message || "Failed to fetch team",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, team: data.data });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};

export const PATCH = async (req: NextRequest) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get("id");
    
    if (!id || id === "null" || id === "undefined") {
      return NextResponse.json(
        { success: false, error: "Team ID is required" },
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

    const body = await req.json();

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/teams/${id}`;
    const response = await fetch(backendUrl, {
      method: "PATCH",
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
          error: data.message || "Failed to update team",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, team: data.data });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get("id");
    
    if (!id || id === "null" || id === "undefined") {
      return NextResponse.json(
        { success: false, error: "Team ID is required" },
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

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/teams/${id}`;
    console.log(`[DELETE Team] Calling backend: ${backendUrl}`);
    
    if (!backendUrl || !process.env.NEXT_PUBLIC_API_URL || !process.env.NEXT_PUBLIC_API_URL.startsWith('http')) {
      console.error('[DELETE Team] Invalid backend URL:', backendUrl);
      return NextResponse.json(
        {
          success: false,
          error: "Backend API URL is not configured properly",
        },
        { status: 500 }
      );
    }
    
    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    console.log(`[DELETE Team] Backend response status: ${response.status}`);

    let data;
    try {
      const text = await response.text();
      console.log(`[DELETE Team] Backend response text:`, text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error("[DELETE Team] Failed to parse response:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from backend",
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error(`[DELETE Team] Backend error:`, data);
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || "Failed to delete team",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: data.message || "Team deleted successfully" });
  } catch (error) {
    console.error("[DELETE Team] Error deleting team:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
};

