import { useState } from "react"
import { useConvexAuth } from "convex/react"
import { useNavigate } from "react-router-dom"
import { PricingTable, CheckoutDialog, useCustomer } from "autumn-js/react"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import {
  MESSAGE_TOP_UP_BUNDLE_SIZE,
  MESSAGE_TOP_UP_PRICE_USD,
  MESSAGE_TOP_UP_PRODUCT_ID,
} from "@/shared/pricing"

export default function PricingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const { checkout } = useCustomer()
  const [isPending, setIsPending] = useState(false)

  const handleCheckout = async () => {
    if (isPending) return

    if (!isAuthenticated) {
      navigate("/auth")
      return
    }

    setIsPending(true)
    try {
      const successUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/pricing?success=messages`
          : undefined

      const result = await checkout({
        productId: MESSAGE_TOP_UP_PRODUCT_ID,
        dialog: CheckoutDialog,
        successUrl,
      })

      if (result?.error) {
        console.error("Autumn checkout failed", result.error)
        toast.error({
          title: "Checkout failed",
          description: result.error.message ?? "Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to initiate checkout", error)
      toast.error({
        title: "Checkout unavailable",
        description: "We couldn't start the upgrade flow. Please try again.",
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <button
        type="button"
        onClick={() => {
          checkout({
            productId: MESSAGE_TOP_UP_PRODUCT_ID,
            dialog: CheckoutDialog,
            // TODO: make it proper for dev
            successUrl: "https://gen.new",
          })
        }}
      >
        Get Pro
      </button>
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground text-lg">
          Send 10 text messages for free each day. Unlock an additional{" "}
          {MESSAGE_TOP_UP_BUNDLE_SIZE.toLocaleString()} messages with a one-time
          ${MESSAGE_TOP_UP_PRICE_USD} top-up.
        </p>
        <div className="flex justify-center">
          <Button type="button" onClick={handleCheckout} disabled={isPending}>
            {isPending
              ? "Starting checkout..."
              : `Buy ${MESSAGE_TOP_UP_BUNDLE_SIZE.toLocaleString()} messages for $${MESSAGE_TOP_UP_PRICE_USD}`}
          </Button>
        </div>
      </header>
      <section className="rounded-2xl border bg-background p-6 shadow-sm">
        <PricingTable />
      </section>
    </div>
  )
}
