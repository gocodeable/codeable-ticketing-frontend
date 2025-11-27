import { NextRequest, NextResponse } from "next/server";

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
    const { file, folder } = body;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File data is required" },
        { status: 400 }
      );
    }

    // Validate base64 format
    if (!file.startsWith("data:")) {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Expected base64 encoded file" },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/upload`;
    
    if (!backendUrl || !backendUrl.startsWith('http')) {
      console.error('Invalid backend URL:', backendUrl);
      return NextResponse.json(
        {
          success: false,
          error: "Backend API URL is not configured",
        },
        { status: 500 }
      );
    }

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file,
        folder: folder || "uploads",
      }),
    });

    // Check if response is actually JSON before parsing
    const contentType = response.headers.get("content-type");
    let data: any;
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Backend returned non-JSON response:", text.substring(0, 200));
      console.error("Response status:", response.status, response.statusText);
      console.error("Backend URL:", backendUrl);
      return NextResponse.json(
        {
          success: false,
          error: `Backend error: ${response.status} ${response.statusText}. Check if backend server is running at ${backendUrl}`,
        },
        { status: response.status || 500 }
      );
    }

    try {
      data = await response.json();
    } catch (parseError) {
      console.error("Failed to parse backend response as JSON:", parseError);
      const text = await response.text().catch(() => "Unable to read response");
      console.error("Response text:", text.substring(0, 200));
      return NextResponse.json(
        {
          success: false,
          error: "Backend returned invalid JSON response. Check backend server logs.",
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Failed to upload file",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error uploading media:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Full error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
};

