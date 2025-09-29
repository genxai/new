import { components } from "./_generated/api"
import { Autumn } from "@useautumn/convex"

const autumnComponent = ((components as any)?.autumn ?? {}) as any

export const autumn = new Autumn(autumnComponent, {
  secretKey: process.env.AUTUMN_SECRET_KEY ?? "",
  identify: async (ctx: any) => {
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
