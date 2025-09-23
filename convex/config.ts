import { query } from "./_generated/server"
import type { MailConfig } from "../shared/config"
import {
  readAppleConfigFromEnv,
  readGithubConfigFromEnv,
  readGoogleConfigFromEnv,
  readMailConfigFromEnv,
} from "../shared/config"

const FALLBACK_ERROR = "Failed to load public configuration."

type PublicConfigResult = {
  githubOAuth: boolean
  githubErrors: readonly string[]
  googleOAuth: boolean
  googleErrors: readonly string[]
  appleOAuth: boolean
  appleErrors: readonly string[]
  mailPreview: boolean
  mailErrors: readonly string[]
  brand: MailConfig["brand"]
}

function buildFallbackConfig(error: string): PublicConfigResult {
  return {
    githubOAuth: false,
    githubErrors: [error],
    googleOAuth: false,
    googleErrors: [error],
    appleOAuth: false,
    appleErrors: [error],
    mailPreview: true,
    mailErrors: [error],
    brand: {},
  }
}

export const publicConfig = query({
  args: {},
  handler: async () => {
    const env = process.env as Record<string, string | undefined>

    try {
      const githubConfig = readGithubConfigFromEnv(env)
      const googleConfig = readGoogleConfigFromEnv(env)
      const appleConfig = readAppleConfigFromEnv(env)
      const mailConfig = readMailConfigFromEnv(env)

      const config: PublicConfigResult = {
        githubOAuth: githubConfig.enabled,
        githubErrors: githubConfig.errors,
        googleOAuth: googleConfig.enabled,
        googleErrors: googleConfig.errors,
        appleOAuth: appleConfig.enabled,
        appleErrors: appleConfig.errors,
        mailPreview: mailConfig.preview,
        mailErrors: mailConfig.errors,
        brand: mailConfig.brand,
      }
      return config
    } catch (error) {
      const message = error instanceof Error ? error.message : FALLBACK_ERROR
      console.error("publicConfig query failed", error)
      return buildFallbackConfig(message || FALLBACK_ERROR)
    }
  },
})
