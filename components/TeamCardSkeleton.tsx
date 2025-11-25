import { Card, CardContent, CardHeader } from "./ui/card"
import { Skeleton } from "./ui/skeleton"

export function TeamCardSkeleton() {
    return (
        <Card className="h-full rounded-xs flex flex-col py-2 px-2 gap-0">
            <CardHeader className="py-0 mb-1 flex justify-start items-center gap-2">
                <Skeleton className="w-10 h-10 rounded-sm" />
                <Skeleton className="h-5 w-2/3" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2 py-0 mt-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                
                <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <Skeleton className="size-7 sm:size-8 rounded-full" />
                            <Skeleton className="size-7 sm:size-8 rounded-full" />
                            <Skeleton className="size-7 sm:size-8 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="size-4 sm:size-5 rounded" />
                </div>
            </CardContent>
        </Card>
    )
}

export function TeamsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="w-full max-w-full overflow-hidden">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: count }).map((_, i) => (
                    <TeamCardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

