import { Polar as PolarClient } from "@convex-dev/polar"
import { api, components } from "./_generated/api"
import type { GenericDataModel } from "convex/server"
import {
  POLAR_TEXT_PLAN_KEY,
  type PolarConfiguredPlanKey,
} from "../shared/polar"

type PolarClientInstance = PolarClient<GenericDataModel, PolarProducts>

type AuthUserRecord = {
  _id: string
  userId?: string | null
  email?: string | null
}

const env = process.env as Record<string, string | undefined>

type PolarProducts = Record<PolarConfiguredPlanKey, string>

const textProductId = env.POLAR_TEXT_PRODUCT_ID?.trim()

const productsConfig = textProductId
  ? ({ [POLAR_TEXT_PLAN_KEY]: textProductId } satisfies PolarProducts)
  : undefined

export const polarIntegration = new PolarClient<GenericDataModel, PolarProducts>(components.polar, {
  products: productsConfig,
  organizationToken: env.POLAR_ORGANIZATION_TOKEN,
  webhookSecret: env.POLAR_WEBHOOK_SECRET,
  server: env.POLAR_SERVER === "production" ? "production" : "sandbox",
  getUserInfo: async (ctx): Promise<{ userId: string; email: string }> => {
    const user = (await ctx.runQuery(api.auth.getCurrentUser, {})) as
      | AuthUserRecord
      | null

    if (!user) {
      throw new Error("Unable to locate the current user for checkout.")
    }

    const email = user.email?.trim() ?? null

    if (!email) {
      throw new Error("A verified email is required to complete checkout.")
    }

    const canonicalUserId = user.userId ?? user._id

    if (!canonicalUserId) {
      throw new Error("Unable to resolve a stable user identifier for Polar.")
    }

    return {
      userId: String(canonicalUserId),
      email,
    }
  },
})

type PolarSubscription = Awaited<
  ReturnType<PolarClientInstance["getCurrentSubscription"]>
>

export type { PolarSubscription }

export const isSubscriptionStatusActive = (
  subscription: PolarSubscription | null | undefined,
): boolean => {
  if (!subscription) {
    return false
  }

  const status = subscription.status?.toLowerCase()

  return status === "active" || status === "trialing"
}

export const hasActiveTextPlan = (
  subscription: PolarSubscription | null | undefined,
): boolean => {
  if (!subscription) {
    return false
  }

  if (subscription.productKey !== POLAR_TEXT_PLAN_KEY) {
    return false
  }

  return isSubscriptionStatusActive(subscription)
}

export const resolveTextPlanProductId = (): string | undefined => textProductId

export const {
  generateCheckoutLink,
  generateCustomerPortalUrl,
  getConfiguredProducts,
  listAllProducts,
  changeCurrentSubscription,
  cancelCurrentSubscription,
} = polarIntegration.api()
