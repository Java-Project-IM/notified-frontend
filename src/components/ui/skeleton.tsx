import { cn } from '@/lib/utils'

/**
 * Skeleton loader component for better loading states
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-700/40', className)} {...props} />
}

/**
 * Table skeleton for loading states
 */
function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`} className="border-b border-slate-700/30">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={`skeleton-col-${colIndex}`} className="p-5">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/**
 * Card skeleton for loading states
 */
function CardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 shadow-enterprise border border-slate-700/50">
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

export { Skeleton, TableSkeleton, CardSkeleton }
