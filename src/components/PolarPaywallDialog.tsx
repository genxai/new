import { useMemo } from "react"
import { useQuery } from "convex/react"
import { Check, Loader2, Shield } from "lucide-react"
import { CheckoutLink } from "@convex-dev/polar/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/api"
import {
  POLAR_TEXT_PLAN_KEY,
  POLAR_TEXT_PLAN_PRICE_USD,
} from "@/shared/polar"
import { cn } from "@/lib/utils"

type PolarPaywallDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasTextSubscription: boolean
}

const PLAN_FEATURES = [
  "Unlimited AI text responses",
  "Priority generation speed",
  "Supports new features & models",
]

function formatPrice({
  amount,
  currency,
}: {
  amount: number | null | undefined
  currency: string | null | undefined
}) {
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return `$${POLAR_TEXT_PLAN_PRICE_USD}`
  }

  const resolvedCurrency = currency?.toUpperCase() ?? "USD"
  const resolvedAmount = amount >= 100 ? amount / 100 : amount

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 2,
  }).format(resolvedAmount)
}

export default function PolarPaywallDialog({
  open,
  onOpenChange,
  hasTextSubscription,
}: PolarPaywallDialogProps) {
  const configuredProducts = useQuery(api.polar.getConfiguredProducts, {})
  const textPlan = configuredProducts?.[POLAR_TEXT_PLAN_KEY]
  const isLoadingProducts = configuredProducts === undefined

  const primaryPrice = useMemo(() => {
    if (!textPlan) {
      return null
    }

    const recurringPrice = textPlan.prices?.find(
      (price) => price.type !== "one_time" && !price.isArchived,
    )

    return {
      label: formatPrice({
        amount: recurringPrice?.priceAmount ?? textPlan.metadata?.priceAmount,
        currency: recurringPrice?.priceCurrency ?? textPlan.metadata?.priceCurrency,
      }),
      interval: recurringPrice?.recurringInterval ?? textPlan.recurringInterval ?? "month",
    }
  }, [textPlan])

  const upgradeLabel = primaryPrice
    ? `${primaryPrice.label}/${primaryPrice.interval ?? "month"}`
    : `$${POLAR_TEXT_PLAN_PRICE_USD}/month`

  const productConfigured = Boolean(textPlan?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border/60 bg-background/95 p-6 backdrop-blur">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-full">
              <Shield className="size-6" aria-hidden />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-semibold tracking-tight">
            Unlock unlimited responses
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground">
            Upgrade to keep the conversation flowing after your 10 free messages.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="space-y-5">
          <ul className="space-y-3">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm leading-6">
                <span className="bg-primary/10 text-primary mt-1 inline-flex size-5 items-center justify-center rounded-full">
                  <Check className="size-3" aria-hidden />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">All-access plan</p>
            <p className="text-2xl font-semibold tracking-tight">{upgradeLabel}</p>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-col items-stretch gap-3">
          {hasTextSubscription ? (
            <Button variant="secondary" disabled>
              You're already upgraded
            </Button>
          ) : isLoadingProducts ? (
            <Button variant="secondary" disabled className="w-full text-sm">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Loading plan…
            </Button>
          ) : productConfigured ? (
            <Button
              size="lg"
              className="w-full text-base font-semibold"
              render={
                <CheckoutLink
                  polarApi={{ generateCheckoutLink: api.polar.generateCheckoutLink }}
                  productIds={[textPlan!.id]}
                />
              }
            >
              Upgrade for {upgradeLabel}
            </Button>
          ) : (
            <Button variant="secondary" disabled className="w-full text-sm">
              Polar product not configured yet
            </Button>
          )}

          <Button
            variant="ghost"
            className={cn("w-full text-sm text-muted-foreground")}
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
