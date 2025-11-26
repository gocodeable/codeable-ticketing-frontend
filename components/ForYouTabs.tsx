"use client"

import { useEffect, useState, Fragment } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import { ItemGroup, ItemSeparator } from "@/components/ui/item"
import { TabsData } from "@/types/tabs"
import { Clock, User, Star } from "lucide-react"
import { useAuth } from "@/lib/auth/AuthProvider"
import { TabItem } from "@/components/TabItem"
import { apiGet } from "@/lib/api/apiClient"
import Loader from "@/components/Loader"



export function ForYouTabs() {
    const [tabsData, setTabsData] = useState<TabsData>({
        workedOn: [],
        assigned: [],
        starred: [],
    })
    const [isLoading, setIsLoading] = useState(true)
    const user = useAuth()?.user

    const fetchTabsData = async () => {
        try {
            if (!user) {
                console.error("No user logged in")
                setTabsData({ workedOn: [], assigned: [], starred: [] })
                setIsLoading(false)
                return
            }

            const idToken = await user.getIdToken()

            const response = await apiGet("/api/tabs", idToken, {
                next:{
                    revalidate: 60
                }
            })

            const data = await response.json()

            if (data.workedOn && data.assigned && data.starred) {
                setTabsData({
                    workedOn: data.workedOn,
                    assigned: data.assigned,
                    starred: data.starred,
                })
            } else {
                console.error("Invalid data received:", data)
                setTabsData({ workedOn: [], assigned: [], starred: [] })
            }
        } catch (error) {
            console.error("Error fetching tabs data:", error)
            setTabsData({ workedOn: [], assigned: [], starred: [] })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTabsData()
    }, [user])

    if (isLoading) {
        return (
            <div className="w-full text-center py-12">
                <Loader size="md" hue={300} />
            </div>
        )
    }

    return (
        <div className="w-full">
            <Tabs defaultValue="worked-on" className="w-full">
                <div className="border-b border-border/50">
                    <TabsList className="w-full sm:w-auto bg-transparent h-auto p-0 space-x-1">
                        <TabsTrigger
                            value="worked-on"
                            className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                        >
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Worked on</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="assigned"
                            className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                        >
                            <User className="w-4 h-4" />
                            <span className="font-medium">Assigned to me</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="starred"
                            className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                        >
                            <Star className="w-4 h-4" />
                            <span className="font-medium">Starred</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="worked-on" className="mt-6">
                    {tabsData.workedOn.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No recent work</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">Items you've worked on recently will appear here</p>
                        </div>
                    ) : (
                        <ItemGroup className="gap-2">
                            {tabsData.workedOn.map((item, index) => (
                                <Fragment key={item.id}>
                                    <TabItem item={item} />
                                    {index < tabsData.workedOn.length - 1 && <ItemSeparator />}
                                </Fragment>
                            ))}
                        </ItemGroup>
                    )}
                </TabsContent>

                <TabsContent value="assigned" className="mt-6">
                    {tabsData.assigned.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <User className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No assignments</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">Tasks assigned to you will appear here</p>
                        </div>
                    ) : (
                        <ItemGroup className="gap-2">
                            {tabsData.assigned.map((item, index) => (
                                <Fragment key={item.id}>
                                    <TabItem item={item} />
                                    {index < tabsData.assigned.length - 1 && <ItemSeparator />}
                                </Fragment>
                            ))}
                        </ItemGroup>
                    )}
                </TabsContent>

                <TabsContent value="starred" className="mt-6">
                    {tabsData.starred.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <Star className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No starred items</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">Star your favorite projects and tasks to find them easily</p>
                        </div>
                    ) : (
                        <ItemGroup className="gap-2">
                            {tabsData.starred.map((item, index) => (
                                <Fragment key={item.id}>
                                    <TabItem item={item} />
                                    {index < tabsData.starred.length - 1 && <ItemSeparator />}
                                </Fragment>
                            ))}
                        </ItemGroup>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}