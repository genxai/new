import { createAuthClient } from "better-auth/react"
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins"
import {
  magicLinkClient,
  emailOTPClient,
  adminClient,
} from "better-auth/client/plugins"

import { handleRateLimitResponse } from "./auth-client-rate-limit"

const resolvedBaseURL =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_CONVEX_SITE_URL ??
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.VITE_CONVEX_SITE_URL

export const authClient = createAuthClient({
  baseURL: resolvedBaseURL,
  fetchOptions: {
    async onResponse(context) {
      if (context?.response) {
        await handleRateLimitResponse(context.response)
      }
    },
    async onError(context) {
      if (context?.response) {
        await handleRateLimitResponse(context.response)
      }
    },
  },
  plugins: [
    magicLinkClient(),
    emailOTPClient(),
    adminClient(),
    crossDomainClient(),
    convexClient(),
  ],
})
