import { Item, ItemContent, ItemTitle, ItemDescription, ItemHeader } from "./ui/item"
import { Badge } from "./ui/badge"
import type { TabItem as TabItemType } from "@/types/tabitem"
import { KanbanIcon } from "lucide-react"

interface TabItemProps {
    item: TabItemType
}

export function TabItem({ item }: TabItemProps) {
    const statusConfig = {
        open: {
            className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
            label: "Open"
        },
        "in-progress": {
            className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
            label: "In Progress"
        },
        closed: {
            className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
            label: "Closed"
        },
    }

    const priorityConfig = {
        low: {
            className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
            label: "Low"
        },
        medium: {
            className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800",
            label: "Medium"
        },
        high: {
            className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800",
            label: "High"
        },
    }

    return (
        <Item variant="outline" className="cursor-pointer hover:bg-accent/50 transition-colors border-none">
            <ItemContent>
                <ItemHeader>
                    <ItemTitle>{item.title}</ItemTitle>
                    <div className="flex items-center gap-2">
                        {item.status && (
                            <Badge className={statusConfig[item.status].className}>
                                {statusConfig[item.status].label}
                            </Badge>
                        )}
                        {item.priority && (
                            <Badge className={priorityConfig[item.priority].className}>
                                {priorityConfig[item.priority].label}
                            </Badge>
                        )}
                    </div>
                </ItemHeader>
                <ItemDescription className="flex items-center gap-1.5">
                    <KanbanIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{item.project}</span>
                </ItemDescription>
            </ItemContent>
        </Item>
    )
}