import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Users, Crown } from "lucide-react";

export function TeamCardSkeleton() {
    return (
        <Card className="h-full rounded-md flex flex-col py-2 px-2 gap-0 animate-pulse">
            <CardHeader className="py-0 mb-2 flex justify-start items-center gap-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 py-0 mt-0">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                
                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <Skeleton className="size-7 sm:size-8 rounded-full ring-2 ring-background" />
                            <Skeleton className="size-7 sm:size-8 rounded-full ring-2 ring-background" />
                            <Skeleton className="size-7 sm:size-8 rounded-full ring-2 ring-background" />
                        </div>
                        <Skeleton className="h-4 w-6" />
                    </div>
                    <Skeleton className="size-4 sm:size-5 rounded-full" />
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
            <div className="flex items-start gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 mt-1">
                    <Icon className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-56" />
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {Array.from({ length: count }).map((_, i) => (
                    <TeamCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

