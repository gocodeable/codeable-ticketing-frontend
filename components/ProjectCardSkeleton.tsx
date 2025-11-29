import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { FolderKanban } from "lucide-react";

export function ProjectCardSkeleton() {
    return (
        <Card className="rounded-lg border border-border/40 dark:border-border/70 animate-pulse">
            <CardContent className="p-3.5">
                {/* Header Row */}
                <div className="flex items-center gap-2.5 mb-2.5">
                    <Skeleton className="shrink-0 w-9 h-9 rounded-md" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="shrink-0 w-4 h-4 rounded" />
                </div>

                {/* Description */}
                <div className="space-y-1.5 mb-2.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/30 dark:border-border/50">
                    <div className="flex -space-x-1.5">
                        <Skeleton className="w-5 h-5 rounded-full ring-1.5 ring-background dark:ring-card" />
                        <Skeleton className="w-5 h-5 rounded-full ring-1.5 ring-background dark:ring-card" />
                        <Skeleton className="w-5 h-5 rounded-full ring-1.5 ring-background dark:ring-card" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                </div>
            </CardContent>
        </Card>
    );
}

export function ProjectsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="w-full max-w-full overflow-hidden">
            {/* Section Header Skeleton */}
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/40 dark:border-border/60">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <FolderKanban className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {Array.from({ length: count }).map((_, i) => (
                    <ProjectCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
