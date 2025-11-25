import { NextResponse } from "next/server"
import { mockWorkedOnItems, mockAssignedItems, mockStarredItems } from "@/lib/mockData"
import { TabsData } from "@/types/tabs"

const getTabsData = async (idToken: string): Promise<TabsData> => {
    return {
        workedOn: mockWorkedOnItems,
        assigned: mockAssignedItems,
        starred: mockStarredItems,
    }
}

export const GET = async (req: Request) => {
    const idToken = req.headers.get("Authorization")?.split(" ")[1]
    
    if (!idToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    try {
        const tabsData = await getTabsData(idToken)
        return NextResponse.json(tabsData)
    } catch (error) {
        console.error("Error fetching tabs data:", error)
        return NextResponse.json(
            { error: "Failed to fetch tabs data" },
            { status: 500 }
        )
    }
}

