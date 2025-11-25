import { useEffect, useState } from "react"
import { RecentsCarousel } from "./RecentsCarousel"
import { Recents as RecentsType  } from "@/types/recents"
import { useAuth } from "@/lib/auth/AuthProvider"
import { ClockFadingIcon } from "lucide-react"
import { apiGet } from "@/lib/api/apiClient"

export function Recents() {
    const [recents, setRecents] = useState<RecentsType[]>([])
    const user = useAuth()?.user
    const fetchRecents = async () => {
        try {
            if (!user) {
                console.error("No user logged in");
                setRecents([]);
                return;
            }
            const idToken = await user.getIdToken();
            
            const response = await apiGet("/api/recents?type=all&limit=5", idToken)
            const data = await response.json()
            
            if (Array.isArray(data)) {
                console.log(data)
                setRecents(data);
            } else {
                console.error("Invalid data received:", data);
                setRecents([]);
            }
        } catch (error) {
            console.error("Error fetching recents:", error);
            setRecents([]);
        }
    }

    useEffect(() => {
        fetchRecents()
    }, [user])
    return recents && recents.length > 0 ? (
        <div className="w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium mb-4">Recents</h2>
                <ClockFadingIcon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            </div>
            <RecentsCarousel recents={recents} />
        </div>
    ) : null;
}