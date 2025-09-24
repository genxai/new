import { Resend } from "@convex-dev/resend"
import { render } from "@react-email/components"
import type { ReactElement } from "react"
import { readMailConfigFromEnv } from "../shared/config"
import type { MailConfig } from "../shared/config"
import { normalizeMailUrl } from "../shared/mail/url"
import type { GenericCtx } from "@convex-dev/better-auth"
import { isActionCtx, isMutationCtx } from "@convex-dev/better-auth/utils"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import MagicLinkEmail from "./emails/magicLink"
import ResetPasswordEmail from "./emails/resetPassword"
import VerifyEmail from "./emails/verifyEmail"
import VerifyOTP from "./emails/verifyOTP"
import type {
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
} from "convex/server"

interface SendEmailOptions {
  ctx: GenericCtx<DataModel>
  mail: MailConfig
  to: string
  subject: string
  type: string
  template: ReactElement
}

const dispatchEmail = async ({
  ctx,
  mail,
  to,
  subject,
  type,
  template,
}: SendEmailOptions) => {
  console.log("[EMAIL DEBUG] Starting email dispatch for type:", type)
  console.log("[EMAIL DEBUG] Mail config:", {
    preview: mail.preview,
    hasResendApiKey: !!mail.resendApiKey,
    from: mail.from,
    errors: mail.errors,
    resendKeyLength: mail.resendApiKey?.length || 0,
  })

  try {
    const html = await render(template)
    const text = await render(template, { plainText: true })

    console.log("[EMAIL DEBUG] Template rendered successfully for", type)

    if (mail.preview) {
      console.warn(
        "MAIL_CONSOLE_PREVIEW=true. Emails are logged but not delivered. Set MAIL_CONSOLE_PREVIEW=false and provide RESEND_API_KEY to send real emails.",
      )
      console.log(
        "[mail preview]",
        JSON.stringify(
          {
            type,
            to,
            from: mail.from,
            subject,
            brand: mail.brand,
            html,
            text,
          },
          null,
          2,
        ),
      )
      console.log("[EMAIL DEBUG] Email dispatched in preview mode for", type)
      return
    }

    console.log("[EMAIL DEBUG] Attempting to send real email for", type)

    // const mutationCtx = requireMutationCtx(ctx)
    const mutationCtx = <DataModel extends GenericDataModel>(
      ctx: GenericCtx<DataModel>,
    ): GenericMutationCtx<DataModel> | GenericActionCtx<DataModel> => {
      if (!isMutationCtx(ctx) && !isActionCtx(ctx)) {
        throw new Error("Mutation or action context required")
      }
      return ctx
    }

    if (mail.errors.length > 0) {
      const errorMsg = `Mail configuration invalid: ${mail.errors.join(" | ")}`
      console.error("[EMAIL DEBUG] Configuration errors:", mail.errors)
      throw new Error(errorMsg)
    }

    if (!mail.resendApiKey) {
      const errorMsg =
        "RESEND_API_KEY is required when MAIL_CONSOLE_PREVIEW=false."
      console.error("[EMAIL DEBUG]", errorMsg)
      throw new Error(errorMsg)
    }

    console.log(
      "[EMAIL DEBUG] Creating Resend client with API key length:",
      mail.resendApiKey.length,
    )

    const resend = new Resend(components.resend, {
      apiKey: mail.resendApiKey,
      testMode: false,
    })

    console.log("[EMAIL DEBUG] Sending email via Resend API:", {
      from: mail.from,
      to,
      subject,
      type,
    })

    const result = await resend.sendEmail(mutationCtx(ctx), {
      from: mail.from,
      to,
      subject,
      html,
      text,
    })

    console.log("[EMAIL DEBUG] Email sent successfully for", type, result)

    // Log to Vercel via API endpoint
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Email sent successfully: ${type}`,
        level: "info",
        context: {
          type,
          to,
          from: mail.from,
          subject,
          resultId: result || "unknown",
        },
      }),
    }).catch((err) => console.warn("Failed to log to Vercel:", err))
  } catch (error) {
    console.error("[EMAIL DEBUG] Error dispatching email for", type, error)

    // Log error to Vercel via API endpoint
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Email dispatch failed: ${type}`,
        level: "error",
        context: {
          type,
          to,
          from: mail.from,
          subject,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      }),
    }).catch((err) => console.warn("Failed to log error to Vercel:", err))

    throw error
  }
}

function getMailConfig(): MailConfig {
  return readMailConfigFromEnv(
    process.env as Record<string, string | undefined>,
  )
}

export const sendEmailVerification = async (
  ctx: GenericCtx<DataModel>,
  {
    to,
    url,
  }: {
    to: string
    url: string
  },
) => {
  console.log("[EMAIL] sendEmailVerification called for", to)
  const mail = getMailConfig()
  const normalizedUrl = normalizeMailUrl(url)
  console.log("[EMAIL] Mail config for verification:", {
    preview: mail.preview,
    from: mail.from,
    hasApiKey: !!mail.resendApiKey,
    errors: mail.errors,
  })
  await dispatchEmail({
    ctx,
    mail,
    to,
    subject: "Verify your email address",
    type: "emailVerification",
    template: <VerifyEmail url={normalizedUrl} brand={mail.brand} />,
  })
}

export const sendOTPVerification = async (
  ctx: GenericCtx<DataModel>,
  {
    to,
    code,
  }: {
    to: string
    code: string
  },
) => {
  const mail = getMailConfig()
  await dispatchEmail({
    ctx,
    mail,
    to,
    subject: "Verify your email address",
    type: "otpVerification",
    template: <VerifyOTP code={code} brand={mail.brand} />,
  })
  if (mail.preview) {
    console.log(`OTP CODE: ${code}`)
  }
}

export const sendMagicLink = async (
  ctx: GenericCtx<DataModel>,
  {
    to,
    url,
  }: {
    to: string
    url: string
  },
) => {
  const mail = getMailConfig()
  const normalizedUrl = normalizeMailUrl(url)
  await dispatchEmail({
    ctx,
    mail,
    to,
    subject: "Sign in to your account",
    type: "magicLink",
    template: <MagicLinkEmail url={normalizedUrl} brand={mail.brand} />,
  })
}

export const sendResetPassword = async (
  ctx: GenericCtx<DataModel>,
  {
    to,
    url,
  }: {
    to: string
    url: string
  },
) => {
  const mail = getMailConfig()
  const normalizedUrl = normalizeMailUrl(url)
  await dispatchEmail({
    ctx,
    mail,
    to,
    subject: "Reset your password",
    type: "resetPassword",
    template: <ResetPasswordEmail url={normalizedUrl} brand={mail.brand} />,
  })
}
