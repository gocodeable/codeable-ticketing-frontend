import { NextRequest, NextResponse } from "next/server"


const getRecents = async (idToken: string, type: string | null, limit: string | null) => {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/for-you/get-recents/${type || "all"}?limit=${limit || "5"}`;
    const response = await fetch(backendUrl, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
        },
        method: "GET"
    })
    if (!response.ok) {
        throw new Error("Failed to fetch recents")
    }
    const data = await response.json();
    return data; // Return the full response with success and data fields
}

export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const limit = searchParams.get("limit")
    const idToken = req.headers.get("Authorization")?.split(" ")[1]
    if (!idToken) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    
    try {
        const recents = await getRecents(idToken, type, limit)
        return NextResponse.json(recents) // Already has success and data fields
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch recents" }, { status: 500 })
    }
}