import { internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { normalizeEmail } from "../shared/identity"
import { authComponent } from "./auth"
import { hashPassword } from "better-auth/crypto"
import { internal } from "./_generated/api"

const isProductionEnvironment =
  (process.env.NODE_ENV ?? "").toLowerCase() === "production"

export const createVerifiedUser = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    productionToken: v.optional(v.string()),
  },
  handler: async (ctx, { email, password, name, productionToken }) => {
    if (
      isProductionEnvironment &&
      productionToken !== "confirm-production-create-verified-user"
    ) {
      throw new Error(
        "createVerifiedUser requires productionToken=\"confirm-production-create-verified-user\" in production.",
      )
    }

    const adapter = authComponent.adapter(ctx) as unknown as {
      findOne: (args: {
        model: string
        where?: { field: string; value: string }[]
      }) => Promise<any>
      create: (args: {
        model: string
        data: Record<string, unknown>
      }) => Promise<any>
      update: (args: {
        model: string
        where: { field: string; value: string }[]
        update: Record<string, unknown>
      }) => Promise<void>
    }
    const { original: originalEmail, lower: normalizedEmail } =
      normalizeEmail(email)
    const resolvedName = (name ?? originalEmail).trim()
    const now = Date.now()

    const existingUser = await adapter.findOne({
      model: "user",
      where: [{ field: "email", value: normalizedEmail }],
    })

    let userId = existingUser?.id

    if (!existingUser) {
      const createdUser = (await adapter.create({
        model: "user",
        data: {
          name: resolvedName,
          email: normalizedEmail,
          emailVerified: true,
          image: null,
          createdAt: now,
          updatedAt: now,
        },
      })) as { id: string }

      userId = createdUser.id
    } else {
      userId = existingUser.id
      await adapter.update({
        model: "user",
        where: [{ field: "id", value: userId }],
        update: {
          name: resolvedName,
          email: normalizedEmail,
          emailVerified: true,
          updatedAt: now,
        },
      })
    }

    if (!userId) {
      throw new Error("Unable to resolve Better Auth user identifier.")
    }

    const hashedPassword = await hashPassword(password)

    const existingAccount = await adapter.findOne({
      model: "account",
      where: [
        { field: "providerId", value: "credential" },
        { field: "userId", value: userId },
      ],
    })

    if (existingAccount) {
      await adapter.update({
        model: "account",
        where: [{ field: "id", value: existingAccount.id }],
        update: {
          password: hashedPassword,
          updatedAt: now,
        },
      })
    } else {
      await adapter.create({
        model: "account",
        data: {
          accountId: userId,
          providerId: "credential",
          userId,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      })
    }

    const finalizeArgs: {
      betterAuthUserId: string
      email: string
      name?: string
    } = { betterAuthUserId: userId, email: normalizedEmail }

    if (resolvedName) {
      finalizeArgs.name = resolvedName
    }

    try {
      await ctx.runMutation(internal.identity.finalizePendingIdentity, finalizeArgs)
    } catch (error) {
      console.warn("[devTools] finalizePendingIdentity failed", error)
    }

    return {
      ok: true as const,
      userId,
      created: !existingUser,
    }
  },
})
