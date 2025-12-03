import { Skeleton } from "./ui/skeleton";
import { DialogTitle } from "./ui/dialog";

export function IssueDetailDialogSkeleton() {
  return (
    <>
      <DialogTitle className="sr-only">Loading issue details</DialogTitle>
      {/* Header Skeleton */}
      <div className="shrink-0 px-6 sm:px-8 pt-6 pb-4 border-b border-border/40 dark:border-border/60 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>

      {/* Two-Column Layout Skeleton */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* Left Column Skeleton */}
        <div className="flex-1 min-h-0 overflow-y-auto border-r border-border/40 dark:border-border/60">
          <div className="px-6 sm:px-8 py-6 space-y-6">
            {/* Description Section */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              {/* Comment Form Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-24 w-full rounded-lg border-2 border-dashed" />
                <div className="flex justify-end">
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
              {/* Comments List Skeleton */}
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-lg border border-border/40 dark:border-border/60 bg-muted/30">
                    <div className="flex items-start gap-3 mb-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="ml-12 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="w-[350px] min-w-[300px] min-h-0 overflow-y-auto bg-muted/10">
          <div className="px-6 sm:px-8 py-6 space-y-6">
            {/* Assignee Section */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Reporter Section */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Dates Section */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>

            {/* Type & Priority Section */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

