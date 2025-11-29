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
            <div className="w-full text-center py-16 bg-card dark:bg-card/50 rounded-2xl border border-border/40">
                <Loader size="md" hue={300} />
            </div>
        )
    }

    return (
        <div className="w-full">
            <Tabs defaultValue="worked-on" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Your Work</h2>
                        <p className="text-sm text-muted-foreground">Track your tasks and projects</p>
                    </div>
                    <TabsList className="bg-muted/50 dark:bg-muted/20 border border-border/40 h-11 p-1 rounded-xl">
                        <TabsTrigger
                            value="worked-on"
                            className="flex items-center gap-2 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
                        >
                            <Clock className="w-4 h-4" />
                            <span className="font-medium text-sm hidden sm:inline">Worked on</span>
                            <span className="font-medium text-sm sm:hidden">Recent</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="assigned"
                            className="flex items-center gap-2 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
                        >
                            <User className="w-4 h-4" />
                            <span className="font-medium text-sm hidden sm:inline">Assigned</span>
                            <span className="font-medium text-sm sm:hidden">Mine</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="starred"
                            className="flex items-center gap-2 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all duration-200"
                        >
                            <Star className="w-4 h-4" />
                            <span className="font-medium text-sm">Starred</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="worked-on" className="mt-0">
                    {tabsData.workedOn.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card dark:bg-card/50 rounded-2xl border border-border/40">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-primary dark:text-primary/90" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No recent work</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Items you've worked on recently will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card dark:bg-card/50 rounded-2xl border border-border/40 p-2">
                            <ItemGroup className="gap-0">
                                {tabsData.workedOn.map((item, index) => (
                                    <Fragment key={item.id}>
                                        <TabItem item={item} />
                                        {index < tabsData.workedOn.length - 1 && <ItemSeparator />}
                                    </Fragment>
                                ))}
                            </ItemGroup>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="assigned" className="mt-0">
                    {tabsData.assigned.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card dark:bg-card/50 rounded-2xl border border-border/40">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 flex items-center justify-center mb-4">
                                <User className="w-8 h-8 text-primary dark:text-primary/90" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No assignments</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Tasks assigned to you will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card dark:bg-card/50 rounded-2xl border border-border/40 p-2">
                            <ItemGroup className="gap-0">
                                {tabsData.assigned.map((item, index) => (
                                    <Fragment key={item.id}>
                                        <TabItem item={item} />
                                        {index < tabsData.assigned.length - 1 && <ItemSeparator />}
                                    </Fragment>
                                ))}
                            </ItemGroup>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="starred" className="mt-0">
                    {tabsData.starred.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card dark:bg-card/50 rounded-2xl border border-border/40">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 flex items-center justify-center mb-4">
                                <Star className="w-8 h-8 text-primary dark:text-primary/90" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No starred items</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Star your favorite projects and tasks to find them easily
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card dark:bg-card/50 rounded-2xl border border-border/40 p-2">
                            <ItemGroup className="gap-0">
                                {tabsData.starred.map((item, index) => (
                                    <Fragment key={item.id}>
                                        <TabItem item={item} />
                                        {index < tabsData.starred.length - 1 && <ItemSeparator />}
                                    </Fragment>
                                ))}
                            </ItemGroup>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
