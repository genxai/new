import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DAILY_LIMIT_RESET_WINDOW_HOURS,
  FREE_GENERATION_LIMITS,
} from "@/shared/usage-limits"

type UsageSnapshot = {
  imageTotal: number
  textCount: number
  freeTextCount?: number
  paidTextCount?: number
  paidBalance?: number
  hasPaidAccess?: boolean
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
  const fallbackSnapshot: UsageSnapshot = {
    imageTotal: 0,
    textCount: 0,
    freeTextCount: 0,
    paidTextCount: 0,
    paidBalance: 0,
    hasPaidAccess: false,
  }
  const snapshot = usage ?? fallbackSnapshot
  const showSkeleton = Boolean(isLoading && !usage)

  const freeUsed = Math.min(
    snapshot.freeTextCount ?? snapshot.textCount,
    authenticatedDailyLimit,
  )
  const freeRemaining = Math.max(authenticatedDailyLimit - freeUsed, 0)
  const paidUsed =
    snapshot.paidTextCount ?? Math.max(snapshot.textCount - freeUsed, 0)
  const paidCreditsRemaining = snapshot.paidBalance ?? 0
  const imageUsed = Math.min(snapshot.imageTotal, authenticatedDailyLimit)
  const imageRemaining = Math.max(authenticatedDailyLimit - imageUsed, 0)
  const paidDetails =
    paidUsed > 0 || paidCreditsRemaining > 0
      ? `${paidUsed} paid used${
          paidCreditsRemaining > 0
            ? ` · ${paidCreditsRemaining} credits left`
            : ""
        }`
      : null

  const summary = showSkeleton
    ? `You can send up to ${authenticatedDailyLimit} text messages and generate ${authenticatedDailyLimit} images each day.`
    : snapshot.hasPaidAccess
      ? `Free messages: ${freeUsed}/${authenticatedDailyLimit}. Paid messages used: ${paidUsed}. ${
          paidCreditsRemaining > 0
            ? `${paidCreditsRemaining} paid credits remain.`
            : "Top up to unlock more messages."
        } Image generations: ${imageUsed}/${authenticatedDailyLimit}.`
      : `Free messages: ${freeUsed}/${authenticatedDailyLimit}. Image generations: ${imageUsed}/${authenticatedDailyLimit}.`

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
          if (item.key === "text") {
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
                        {freeUsed} / {authenticatedDailyLimit} free used
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatRemainingLabel(freeRemaining)}
                      </div>
                      {paidDetails ? (
                        <div className="text-xs text-muted-foreground">
                          {paidDetails}
                        </div>
                      ) : null}
                    </div>
                  )}
                </dd>
              </div>
            )
          }

          const used = imageUsed
          const remaining = imageRemaining

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
