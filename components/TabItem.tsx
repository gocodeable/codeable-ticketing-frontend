import { Item, ItemContent, ItemTitle, ItemHeader } from "./ui/item"
import { Badge } from "./ui/badge"
import type { TabItem as TabItemType } from "@/types/tabitem"
import { KanbanIcon, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

interface TabItemProps {
    item: TabItemType
}

export function TabItem({ item }: TabItemProps) {
    const router = useRouter()

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
        highest: {
            className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800/50",
            label: "Highest"
        },
        lowest: {
            className: "bg-slate-50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400 border-slate-200 dark:border-slate-800/50",
            label: "Lowest"
        },
    }

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (item.projectId) {
            router.push(`/project/${item.projectId}?issueId=${item.id}`)
        } else {
            console.warn("Project ID not available for issue:", item.id)
        }
    }

    return (
        <Item
            variant="outline"
            className="cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/5 transition-all duration-200 border-none rounded-xl group"
            onClick={handleClick}
        >
            <ItemContent>
                <ItemHeader>
                    <div className="flex items-start justify-between gap-2 w-full">
                        <div className="flex-1 min-w-0">
                            <ItemTitle className="group-hover:text-primary transition-colors line-clamp-2">
                                {item.title}
                            </ItemTitle>
                            {item.issueCode && (
                                <span className="text-xs font-mono text-primary/70 dark:text-primary/60 mt-1 block">
                                    {item.issueCode}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {item.priority && (
                                <Badge className={`${priorityConfig[item.priority as keyof typeof priorityConfig]?.className || priorityConfig.medium.className} text-xs font-semibold border`}>
                                    {priorityConfig[item.priority as keyof typeof priorityConfig]?.label || item.priority}
                                </Badge>
                            )}
                        </div>
                    </div>
                </ItemHeader>
                <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <KanbanIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate text-muted-foreground">{item.project}</span>
                    </div>
                    {item.commentCount !== undefined && (
                        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{item.commentCount}</span>
                        </div>
                    )}
                </div>
            </ItemContent>
        </Item>
    )
}
