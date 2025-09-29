import { components } from "./_generated/api"
import { Autumn } from "@useautumn/convex"
import type { GenericCtx } from "./_generated/server"

export const autumn = new Autumn(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY ?? "",
  identify: async (ctx: GenericCtx) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return null

    return {
      customerId: user.subject as string,
      customerData: {
        name: user.name ?? undefined,
        email: user.email ?? undefined,
      },
    }
  },
})

export const {
  track,
  cancel,
  query,
  attach,
  check,
  checkout,
  usage,
  setupPayment,
  createCustomer,
  listProducts,
  billingPortal,
  createReferralCode,
  redeemReferralCode,
  createEntity,
  getEntity,
} = autumn.api()
