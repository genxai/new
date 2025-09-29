import { v } from "convex/values"
import { generateText } from "ai"
import { query, mutation, action } from "./_generated/server"
import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { FREE_GENERATION_LIMITS } from "../shared/usage-limits"
import { autumn } from "./autumn"

type AiGenerateTextResult = Awaited<ReturnType<typeof generateText>>

const MAX_FREE_GENERATION_LIMIT = Math.max(
  FREE_GENERATION_LIMITS.anonymous,
  FREE_GENERATION_LIMITS.authenticated,
)

const AUTUMN_MESSAGES_FEATURE_ID = "messages"
const AUTUMN_REQUIRED_BALANCE = 1

export const generateImage = action({
  args: {
    prompt: v.string(),
    clientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const isAuthenticated = Boolean(identity)
    const userId = identity?.subject
      ? identity.subject
      : args.clientId
        ? `guest:${args.clientId}`
        : null

    if (!userId) {
      throw new Error("Missing client identifier for guest session")
    }

    const usage = await ctx.runQuery(api.images.getGenerationUsage, {
      userId,
      clientId: args.clientId,
    })

    const limit = isAuthenticated
      ? FREE_GENERATION_LIMITS.authenticated
      : FREE_GENERATION_LIMITS.anonymous

    const limitReached = usage.imageTotal >= limit

    if (isAuthenticated && limitReached) {
      throw new Error("Free generation limit reached")
    }

    const generationId: Id<"imageGenerations"> = await ctx.runMutation(
      api.images.createGeneration,
      {
        prompt: args.prompt,
        userId,
      },
    )

    try {
      const result = await generateText({
        model: "google/gemini-2.5-flash-image-preview",
        providerOptions: {
          google: { responseModalities: ["TEXT", "IMAGE"] },
        },
        prompt: args.prompt,
      })

      if (result.text) {
        console.log("Received text from Gemini:", result.text)
      }

      const imageFiles = result.files.filter((f) =>
        f.mediaType?.startsWith("image/"),
      )

      if (imageFiles.length === 0) {
        throw new Error("Model returned no image files")
      }

      const storageIds: Array<Id<"_storage">> = []
      for (const [, file] of imageFiles.entries()) {
        const blob = new Blob([new Uint8Array(file.uint8Array)], {
          type: file.mediaType ?? "image/png",
        })
        const storageId = await ctx.storage.store(blob)
        storageIds.push(storageId)
      }

      await ctx.runMutation(api.images.updateGeneration, {
        generationId,
        storageIds,
        status: "completed",
        description: result.text,
      })

      const imageUrls = await Promise.all(
        storageIds.map(async (id) => {
          try {
            const url = await ctx.storage.getUrl(id)
            return url ?? undefined
          } catch (error) {
            console.error("Error creating storage URL", error)
            return undefined
          }
        }),
      )

      return {
        success: true,
        generationId,
        imageUrls: imageUrls.filter((url): url is string => Boolean(url)),
        description: result.text,
      }
    } catch (error) {
      await ctx.runMutation(api.images.updateGeneration, {
        generationId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  },
})

export const createGeneration = mutation({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("imageGenerations", {
      userId: args.userId,
      prompt: args.prompt,
      status: "pending",
    })
  },
})

export const updateGeneration = mutation({
  args: {
    generationId: v.id("imageGenerations"),
    storageIds: v.optional(v.array(v.id("_storage"))),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId)
    if (!generation) {
      throw new Error("Generation not found or access denied")
    }

    await ctx.db.patch(args.generationId, {
      storageIds: args.storageIds,
      status: args.status,
      error: args.error,
      description: args.description,
    })
  },
})

export const getUserGenerations = query({
  args: { clientId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
      ? identity.subject
      : args.clientId
        ? `guest:${args.clientId}`
        : null

    if (!userId) {
      return []
    }

    const generations = await ctx.db
      .query("imageGenerations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20)

    const withUrls = await Promise.all(
      generations.map(async (g) => {
        const urls =
          g.storageIds && g.storageIds.length > 0
            ? await Promise.all(
                g.storageIds.map(async (id) => {
                  try {
                    return await ctx.storage.getUrl(id)
                  } catch (e) {
                    console.error("Error getting storage URL for", id, e)
                    return undefined
                  }
                }),
              )
            : []

        return { ...g, imageUrls: urls.filter((url): url is string => !!url) }
      }),
    )

    return withUrls
  },
})

export const getGenerationUsage = query({
  args: {
    userId: v.optional(v.string()),
    clientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const providedUserId = args.userId ?? null
    const identity = await ctx.auth.getUserIdentity()
    const resolvedUserId =
      providedUserId ??
      (identity?.subject
        ? identity.subject
        : args.clientId
          ? `guest:${args.clientId}`
          : null)

    if (!resolvedUserId) {
      return {
        imageTotal: 0,
        completed: 0,
        textCount: 0,
        freeTextCount: 0,
        paidTextCount: 0,
        hasPaidAccess: false,
      }
    }

    const generations = await ctx.db
      .query("imageGenerations")
      .withIndex("by_user", (q) => q.eq("userId", resolvedUserId))
      .take(MAX_FREE_GENERATION_LIMIT + 1)

    let completed = 0
    for (const generation of generations) {
      if (generation.status === "completed") {
        completed += 1
      }
    }

    const textInteractions = await ctx.db
      .query("textInteractions")
      .withIndex("by_user", (q) => q.eq("userId", resolvedUserId))
      .collect()

    let freeTextCount = 0
    let paidTextCount = 0

    for (const interaction of textInteractions) {
      const source = interaction.source ?? "free"
      if (source === "paid") {
        paidTextCount += 1
      } else {
        freeTextCount += 1
      }
    }

    let paidBalance: number | undefined
    let hasPaidAccess = false

    if (identity && identity.subject === resolvedUserId) {
      const checkResult = await autumn.check(ctx, {
        featureId: AUTUMN_MESSAGES_FEATURE_ID,
        requiredBalance: AUTUMN_REQUIRED_BALANCE,
        sendEvent: false,
      })

      if (!checkResult.error && checkResult.data) {
        hasPaidAccess = Boolean(checkResult.data.allowed)
        const balanceValue = checkResult.data.balance
        if (typeof balanceValue === "number") {
          paidBalance = balanceValue
        } else if (balanceValue !== undefined && balanceValue !== null) {
          const numericBalance = Number(balanceValue)
          if (!Number.isNaN(numericBalance)) {
            paidBalance = numericBalance
          }
        }
      } else if (checkResult.error) {
        console.error("Autumn check failed during usage lookup", checkResult.error)
      }
    }

    return {
      imageTotal: generations.length,
      completed,
      textCount: textInteractions.length,
      freeTextCount,
      paidTextCount,
      paidBalance,
      hasPaidAccess,
    }
  },
})

type GenerationUsageSummary = {
  imageTotal: number
  completed: number
  textCount: number
  freeTextCount: number
  paidTextCount: number
  paidBalance?: number
  hasPaidAccess?: boolean
}

type TextResponsePayload = {
  success: boolean
  text: string
  isFallback: boolean
  limitReached: boolean
}

const FALLBACK_LIMIT_MESSAGE =
  "You've reached the free message limit. Upgrade to unlock more messages."
const FALLBACK_UNAVAILABLE_MESSAGE =
  "Text generation is temporarily unavailable. Please try again later."

export const generateTextResponse = action({
  args: {
    prompt: v.string(),
    clientId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<TextResponsePayload> => {
    const identity = await ctx.auth.getUserIdentity()
    const isAuthenticated = Boolean(identity)
    const userId = identity?.subject
      ? identity.subject
      : args.clientId
        ? `guest:${args.clientId}`
        : null

    if (!userId) {
      throw new Error("Missing client identifier for guest session")
    }

    const textUsage = (await ctx.runQuery(api.images.getGenerationUsage, {
      userId,
      clientId: args.clientId,
    })) as GenerationUsageSummary

    const freeTextCount =
      textUsage.freeTextCount ??
      Math.min(textUsage.textCount, FREE_GENERATION_LIMITS.authenticated)

    const hasFreeQuota = isAuthenticated
      ? freeTextCount < FREE_GENERATION_LIMITS.authenticated
      : textUsage.textCount < FREE_GENERATION_LIMITS.anonymous

    let hasPaidQuota = Boolean(
      isAuthenticated &&
        !hasFreeQuota &&
        (textUsage.hasPaidAccess ?? false),
    )

    if (isAuthenticated && !hasFreeQuota && textUsage.hasPaidAccess === undefined) {
      const checkResult = await autumn.check(ctx, {
        featureId: AUTUMN_MESSAGES_FEATURE_ID,
        requiredBalance: AUTUMN_REQUIRED_BALANCE,
        sendEvent: false,
      })

      if (!checkResult.error && checkResult.data?.allowed) {
        hasPaidQuota = true
      } else if (checkResult.error) {
        console.error("Autumn check failed during text generation", checkResult.error)
      }
    }

    const willUsePaidCredit = isAuthenticated && !hasFreeQuota && hasPaidQuota
    const shouldEnforceLimit = !hasFreeQuota && !hasPaidQuota
    const limitReached = shouldEnforceLimit

    let result: AiGenerateTextResult | null = null
    let text = ""
    let isFallback = false
    let errorMessage: string | undefined

    if (!shouldEnforceLimit) {
      try {
        result = await generateText({
          model: "google/gemini-2.0-flash",
          providerOptions: {
            google: {},
          },
          prompt: args.prompt,
        })
        text = result.text?.trim() ?? ""
      } catch (error) {
        console.error("Text generation request failed", error)
        errorMessage = error instanceof Error ? error.message : "Unknown error"
        text = ""
      }

      if (!text) {
        isFallback = true
        if (!errorMessage) {
          errorMessage = "Model returned no text"
        }
        text = FALLBACK_UNAVAILABLE_MESSAGE
      }
    } else {
      isFallback = true
      errorMessage = "Free text generation limit reached"
      text = FALLBACK_LIMIT_MESSAGE
    }

    const success = !isFallback

    try {
      await ctx.runMutation(api.images.logTextInteraction, {
        userId,
        prompt: args.prompt,
        success,
        fallback: isFallback ? true : undefined,
        error: success ? undefined : errorMessage,
        source: willUsePaidCredit ? "paid" : "free",
        createdAt: Date.now(),
      })
    } catch (logError) {
      console.error("Failed to log text interaction", logError)
    }

    if (success && willUsePaidCredit) {
      const trackResult = await autumn.track(ctx, {
        featureId: AUTUMN_MESSAGES_FEATURE_ID,
        value: 1,
      })

      if (trackResult.error) {
        console.error("Failed to track Autumn usage", trackResult.error)
      }
    }

    return {
      success,
      text,
      isFallback,
      limitReached,
    }
  },
})

export const logTextInteraction = mutation({
  args: {
    userId: v.string(),
    prompt: v.string(),
    success: v.boolean(),
    fallback: v.optional(v.boolean()),
    error: v.optional(v.string()),
    source: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("textInteractions", {
      userId: args.userId,
      prompt: args.prompt,
      success: args.success,
      fallback: args.fallback,
      error: args.error,
      source: args.source ?? "free",
      createdAt: args.createdAt ?? Date.now(),
    })
  },
})
