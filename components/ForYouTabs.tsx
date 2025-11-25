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
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="worked-on" className="flex items-center gap-2 ">
                        <Clock className="w-4 h-4" />
                        <span>Worked on</span>
                    </TabsTrigger>
                    <TabsTrigger value="assigned" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Assigned to me</span>
                    </TabsTrigger>
                    <TabsTrigger value="starred" className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        <span>Starred</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="worked-on" className="mt-6">
                    {tabsData.workedOn.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No items you've worked on recently</p>
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
                        <div className="text-center py-12 text-muted-foreground">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No items assigned to you</p>
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
                        <div className="text-center py-12 text-muted-foreground">
                            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No starred items</p>
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