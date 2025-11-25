import { useEffect, useState } from "react"
import { RecentsCarousel } from "./RecentsCarousel"
import { Recents as RecentsType  } from "@/types/recents"
import { useAuth } from "@/lib/auth/AuthProvider"
import { History } from "lucide-react"
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

            if (data.success && Array.isArray(data.data)) {
                setRecents(data.data);
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
            <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <History className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Recent Activity</h2>
            </div>
            <RecentsCarousel recents={recents} />
        </div>
    ) : null;
}