import { NextRequest, NextResponse } from "next/server";

// Set or clear the build QA should test, without moving the ticket.
// `build: null` removes it. The backend validates the URL and enforces
// who is allowed to set it.
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { issueId } = await params;
    const { build } = await req.json();

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/issues/${issueId}/build`;
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ build: build ?? null }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Failed to update build",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error updating issue build:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};
