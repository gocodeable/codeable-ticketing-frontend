import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("uid");
        const idToken = request.headers.get("Authorization")?.split(" ")[1];
        if (!uid) {
            return NextResponse.json(
                { success: false, error: "User ID is required" },
                { status: 400 }
            );
        }
        
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${uid}`;
        const res = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
        });
        const data = await res.json();
        if (!data.success) {
            return NextResponse.json({ success: false, error: data.message || "Failed to check user" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: data.data });
    } catch (error: any) {
        console.error("API Route error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user } = await request.json();
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/`;
        const res = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
            })
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Backend error:", errorText);
            
            // Check if it's a duplicate key error (user already exists)
            // This is OK - it means the user was already created
            if (errorText.includes("E11000") || errorText.includes("duplicate key")) {
                console.log("User already exists in backend, treating as success");
                return NextResponse.json({ 
                    success: true, 
                    data: { message: "User already exists" } 
                });
            }
            
            return NextResponse.json(
                { success: false, error: errorText || "Failed to create user" },
                { status: res.status }
            );
        }
        
        const data = await res.json();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("API Route error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { name, bio, avatar } = await request.json();
        const idToken = request.headers.get("Authorization")?.split(" ")[1];
        
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/`;
        const res = await fetch(backendUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
                name,
                bio,
                avatar,
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Backend error:", errorText);
            return NextResponse.json(
                { success: false, error: errorText || "Failed to update user" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data: data.data });
    } catch (error: any) {
        console.error("API Route error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
export async function PATCH(request: NextRequest) {
    try {
        const idToken = request.headers.get("Authorization")?.split(" ")[1];
        
        if (!idToken) {
            return NextResponse.json(
                { success: false, error: "No authorization token provided" },
                { status: 401 }
            );
        }

        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/last-signin`;
        const res = await fetch(backendUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Backend error:", errorText);
            return NextResponse.json(
                { success: false, error: errorText || "Failed to update last sign-in" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data: data.data });
    } catch (error: any) {
        console.error("API Route error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}