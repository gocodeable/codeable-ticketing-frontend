import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Users, Crown } from "lucide-react";

export function TeamCardSkeleton() {
    return (
        <Card className="h-full rounded-xl flex flex-col border-border/40 dark:border-border p-3.5 animate-pulse">
            <CardContent className="p-0 flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                    <Skeleton className="shrink-0 w-9 h-9 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/40 dark:border-border/60">
                    <div className="flex -space-x-1.5">
                        <Skeleton className="w-6 h-6 rounded-full ring-2 ring-background dark:ring-background" />
                        <Skeleton className="w-6 h-6 rounded-full ring-2 ring-background dark:ring-background" />
                        <Skeleton className="w-6 h-6 rounded-full ring-2 ring-background dark:ring-background" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                </div>
            </CardContent>
        </Card>
    );
}

export function TeamsSkeleton({ count = 3, type = "myTeams" }: { count?: number; type?: string }) {
    const Icon = type === "workingIn" ? Users : Crown;

    return (
        <div className="w-full max-w-full overflow-hidden">
            {/* Section Header Skeleton */}
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/40 dark:border-border/60">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Icon className="w-5 h-5 text-primary dark:text-primary/90 animate-pulse" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-56" />
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: count }).map((_, i) => (
                    <TeamCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

