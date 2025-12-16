import { Item, ItemContent, ItemTitle, ItemHeader } from "./ui/item"
import { Badge } from "./ui/badge"
import type { TabItem as TabItemType } from "@/types/tabitem"
import { KanbanIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { getPriorityColor } from "@/utils/issueUtils"
import { PriorityIcon } from "@/components/PriorityIcon"
import Image from "next/image"

interface TabItemProps {
    item: TabItemType
}

export function TabItem({ item }: TabItemProps) {
    const router = useRouter()

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
            className="cursor-pointer my-1 hover:bg-primary/5 dark:hover:bg-primary/5 transition-all duration-200 border-none rounded-lg group"
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
                                <Badge className={`${getPriorityColor(item.priority)} inline-flex items-center font-semibold border`}>
                                    <PriorityIcon priority={item.priority} className="w-3.5 h-3.5" />
                                </Badge>
                            )}
                        </div>
                    </div>
                </ItemHeader>
                <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {item.projectImg ? (
                            <Image
                                src={item.projectImg}
                                alt={item.project || 'Project'}
                                width={16}
                                height={16}
                                className="w-4 h-4 rounded-md object-cover ring-1 ring-border/20 shrink-0"
                            />
                        ) : (
                            <div className="w-4 h-4 bg-linear-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center ring-1 ring-primary/20 shrink-0">
                                <span className="text-primary font-bold text-[8px] leading-none">
                                    {item.projectCode?.slice(0, 2) || (item.project ? item.project.slice(0, 2).toUpperCase() : "PR")}
                                </span>
                            </div>
                        )}
                        <span className="truncate text-muted-foreground">{item.project}</span>
                    </div>
                    {item.commentCount !== undefined && (
                        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                            <KanbanIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{item.commentCount}</span>
                        </div>
                    )}
                </div>
            </ItemContent>
        </Item>
    )
}
