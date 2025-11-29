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
            className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
            label: "Open"
        },
        "in-progress": {
            className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
            label: "In Progress"
        },
        closed: {
            className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
            label: "Closed"
        },
    }

    const priorityConfig = {
        low: {
            className: "bg-slate-50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400 border-slate-200 dark:border-slate-800/50",
            label: "Low"
        },
        medium: {
            className: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-800/50",
            label: "Medium"
        },
        high: {
            className: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/50",
            label: "High"
        },
    }

    return (
        <Item
            variant="outline"
            className="cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/5 transition-all duration-200 border-none rounded-xl group"
        >
            <ItemContent>
                <ItemHeader>
                    <ItemTitle className="group-hover:text-primary transition-colors">{item.title}</ItemTitle>
                    <div className="flex items-center gap-2">
                        {item.priority && (
                            <Badge className={`${priorityConfig[item.priority].className} text-xs font-semibold border`}>
                                {priorityConfig[item.priority].label}
                            </Badge>
                        )}
                    </div>
                </ItemHeader>
                <ItemDescription className="flex items-center gap-1.5">
                    <KanbanIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{item.project}</span>
                </ItemDescription>
            </ItemContent>
        </Item>
    )
}
