import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DAILY_LIMIT_RESET_WINDOW_HOURS,
  FREE_GENERATION_LIMITS,
} from "@/shared/usage-limits"

type UsageSnapshot = {
  imageTotal: number
  textCount: number
}

type UsageLimitsSectionProps = {
  className?: string
  headingLevel?: "h2" | "h3"
  usage?: UsageSnapshot | null
  isLoading?: boolean
}

const LIMIT_CATEGORIES = [
  {
    key: "text",
    label: "Text messages",
    accessor: (usage: UsageSnapshot) => usage.textCount,
  },
  {
    key: "image",
    label: "Image generations",
    accessor: (usage: UsageSnapshot) => usage.imageTotal,
  },
] as const

const formatRemainingLabel = (remaining: number) => {
  if (remaining <= 0) {
    return "Limit reached today"
  }
  if (remaining === 1) {
    return "1 left today"
  }
  return `${remaining} left today`
}

export default function UsageLimitsSection({
  className,
  headingLevel = "h2",
  usage,
  isLoading,
}: UsageLimitsSectionProps) {
  const authenticatedDailyLimit = FREE_GENERATION_LIMITS.authenticated
  const resetWindowLabel =
    DAILY_LIMIT_RESET_WINDOW_HOURS === 24
      ? "day"
      : `${DAILY_LIMIT_RESET_WINDOW_HOURS} hours`
  const HeadingTag = headingLevel
  const snapshot = usage ?? { imageTotal: 0, textCount: 0 }
  const showSkeleton = Boolean(isLoading && !usage)

  const summary = showSkeleton
    ? `You can send up to ${authenticatedDailyLimit} text messages and generate ${authenticatedDailyLimit} images each day.`
    : `You've used ${Math.min(snapshot.textCount, authenticatedDailyLimit)} of ${authenticatedDailyLimit} text messages and ${Math.min(snapshot.imageTotal, authenticatedDailyLimit)} of ${authenticatedDailyLimit} image generations today.`

  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <HeadingTag className="text-lg font-semibold leading-tight">
          Usage limits
        </HeadingTag>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {LIMIT_CATEGORIES.map((item) => {
          const used = Math.min(item.accessor(snapshot), authenticatedDailyLimit)
          const remaining = Math.max(authenticatedDailyLimit - used, 0)

          return (
            <div key={item.key} className="rounded-lg border bg-muted/40 p-4">
              <dt className="text-sm font-medium text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-2">
                {showSkeleton ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-semibold">
                      {used} / {authenticatedDailyLimit} used
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRemainingLabel(remaining)}
                    </div>
                  </div>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
      <p className="text-xs text-muted-foreground">
        Limits reset every {resetWindowLabel}.
      </p>
    </section>
  )
}
