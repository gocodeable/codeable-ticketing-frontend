import { NextRequest, NextResponse } from "next/server";

const backend = (id: string, buildId: string) =>
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${id}/builds/${buildId}`;

// Update a build. Changing `url` is open to any project member and is what
// notifies QA; renaming is restricted. The backend decides both.
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; buildId: string }> }
) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, buildId } = await params;
    const body = await req.json();
    // Forward only what the caller actually set, so an absent field is not
    // read as "clear it"
    const payload: Record<string, unknown> = {};
    for (const key of ["name", "platform", "url", "note"]) {
      if (body[key] !== undefined) payload[key] = body[key];
    }

    const response = await fetch(backend(id, buildId), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to update build" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error updating build:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; buildId: string }> }
) => {
  try {
    const idToken = req.headers.get("Authorization")?.split(" ")[1];
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, buildId } = await params;
    const response = await fetch(backend(id, buildId), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to remove build" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing build:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};
