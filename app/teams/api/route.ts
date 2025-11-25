import { NextResponse } from "next/server"

const getUserTeams = async (idToken: string, uid: string) => {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/teams/user/${uid}`;
    const response = await fetch(backendUrl, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
        },
        method: "GET"
    });
    
    return response;
}

export const GET = async (req: Request) => {
    const idToken = req.headers.get("Authorization")?.split(" ")[1]
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    
    if (!uid) {
        return NextResponse.json({success: false, error: "User ID is required"}, { status: 400 })
    }
    if (!idToken) {
        return NextResponse.json({success: false, error: "Unauthorized"}, { status: 401 })
    }
    
    try {
        const response = await getUserTeams(idToken, uid);
        
        if (response.status === 401) {
            return NextResponse.json(
                {success: false, error: "Unauthorized"}, 
                { status: 401 }
            );
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
            return NextResponse.json(
                {success: false, error: errorData.message || "Failed to fetch teams"}, 
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json({success: data.success, data: data.data});
    } catch (error) {
        console.error("Error fetching teams:", error)
        return NextResponse.json({success: false, error: "Failed to fetch teams"}, { status: 500 })
    }
}

