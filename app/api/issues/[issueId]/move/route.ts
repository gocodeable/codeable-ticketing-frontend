import { NextRequest, NextResponse } from "next/server";

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
    const body = await req.json();
    const { workflowStatusId, position } = body;

    if (!workflowStatusId) {
      return NextResponse.json(
        { success: false, error: "Workflow status ID is required" },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/issues/${issueId}/move`;
    const response = await fetch(backendUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workflowStatusId, position }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Failed to move issue",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error moving issue:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
};

