import { Skeleton } from "./ui/skeleton"

export function TeamPageSkeleton() { 
    return (
      <div className="w-full min-w-0 bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background min-h-screen">
        <main className="w-full mx-auto flex flex-col items-start justify-start gap-y-8 py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12">
          <Skeleton className="h-10 w-24" />
          
          <div className="w-full bg-card rounded-lg border shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
  
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
  
          <div className="w-full bg-card rounded-lg border shadow-sm p-6">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

