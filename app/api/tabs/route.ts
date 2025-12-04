import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const idToken = request.headers.get("Authorization")?.split(" ")[1]
        if (!idToken) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }

        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/for-you/tabs`
        const response = await fetch(backendUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
            },
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                {
                    success: false,
                    error: data.message || "Failed to fetch tabs data",
                },
                { status: response.status }
            )
        }

        // Return the data in the expected format
        return NextResponse.json(data.data || { workedOn: [], assigned: [], starred: [] })
    } catch (error) {
        console.error("Error fetching tabs data:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        )
    }
}

