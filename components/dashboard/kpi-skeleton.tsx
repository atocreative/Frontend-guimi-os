import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface KpiSkeletonProps {
  destaque?: boolean
}

export function KpiSkeleton({ destaque }: KpiSkeletonProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden",
      destaque && "border-zinc-400 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className={cn(
              "h-3 w-24",
              destaque && "bg-zinc-800 dark:bg-zinc-100"
            )} />
            <Skeleton className={cn(
              "h-8 w-32",
              destaque && "bg-zinc-800 dark:bg-zinc-100"
            )} />
            <Skeleton className={cn(
              "h-3 w-40",
              destaque && "bg-zinc-800 dark:bg-zinc-100"
            )} />
          </div>
          <div className={cn(
            "rounded-lg p-2",
            destaque ? "bg-zinc-800 dark:bg-zinc-100" : "bg-muted"
          )}>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
