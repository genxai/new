import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DAILY_LIMIT_RESET_WINDOW_HOURS,
  FREE_GENERATION_LIMITS,
} from "@/shared/usage-limits"

type UsageSnapshot = {
  imageTotal: number
  textCount: number
  hasTextSubscription?: boolean
}

type UsageLimitsSectionProps = {
  className?: string
  headingLevel?: "h2" | "h3"
  usage?: UsageSnapshot | null
  isLoading?: boolean
}

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
  const snapshot = usage ?? {
    imageTotal: 0,
    textCount: 0,
    hasTextSubscription: false,
  }
  const showSkeleton = Boolean(isLoading && !usage)

  const hasTextSubscription = Boolean(snapshot.hasTextSubscription)

  const summary = showSkeleton
    ? `You can send up to ${authenticatedDailyLimit} text messages and generate ${authenticatedDailyLimit} images each day.`
    : hasTextSubscription
      ? `Unlimited text responses unlocked. Image generations remain capped at ${authenticatedDailyLimit} per day.`
      : `You've used ${Math.min(snapshot.textCount, authenticatedDailyLimit)} of ${authenticatedDailyLimit} text messages and ${Math.min(snapshot.imageTotal, authenticatedDailyLimit)} of ${authenticatedDailyLimit} image generations today.`

  const limits = [
    {
      key: "text" as const,
      label: "Text messages",
      used: snapshot.textCount,
      limit: hasTextSubscription ? null : authenticatedDailyLimit,
      unlimited: hasTextSubscription,
    },
    {
      key: "image" as const,
      label: "Image generations",
      used: snapshot.imageTotal,
      limit: authenticatedDailyLimit,
      unlimited: false,
    },
  ]

  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <HeadingTag className="text-lg font-semibold leading-tight">
          Usage limits
        </HeadingTag>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {limits.map((item) => {
          const used = item.unlimited
            ? item.used
            : Math.min(item.used, item.limit ?? 0)
          const remaining =
            item.unlimited || item.limit === null
              ? null
              : Math.max((item.limit ?? 0) - used, 0)

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
                      {item.unlimited ? (
                        <span className="text-primary">Unlimited</span>
                      ) : (
                        <>
                          {used} / {item.limit} used
                        </>
                      )}
                    </div>
                    {item.unlimited ? (
                      <div className="text-xs text-muted-foreground">
                        Included with your $5 upgrade
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {remaining !== null
                          ? formatRemainingLabel(remaining)
                          : null}
                      </div>
                    )}
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
