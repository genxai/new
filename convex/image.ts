import { action, internalMutation, query } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"

type ImageProviderResponse = {
  imageBase64?: string
  image?: string
  data?: {
    image?: string
    imageBase64?: string
  }
  error?: string
}

const normalizeImageData = (payload: ImageProviderResponse) => {
  const fromRoot = payload.imageBase64 ?? payload.image
  const fromNested = payload.data?.imageBase64 ?? payload.data?.image
  const raw = fromRoot ?? fromNested
  if (!raw) {
    return null
  }

  if (raw.startsWith("data:")) {
    return raw
  }

  return `data:image/png;base64,${raw}`
}

type GetIdentity = () => Promise<{ subject: string } | null>

const resolveUserKey = async (
  getUserIdentity: GetIdentity,
  sessionId: string,
) => {
  const identity = await getUserIdentity()
  if (identity) {
    return identity.subject
  }
  return `anon:${sessionId}`
}

export const recent = query({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, limit }) => {
    const userKey = await resolveUserKey(
      ctx.auth.getUserIdentity,
      sessionId,
    )

    const pageSize = Math.min(limit ?? 5, 10)

    return ctx.db
      .query("imageGenerations")
      .withIndex("by_userKey_createdAt", (q) => q.eq("userKey", userKey))
      .order("desc")
      .take(pageSize)
  },
})

export const createGenerationRecord = internalMutation({
  args: {
    userKey: v.string(),
    prompt: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("imageGenerations", {
      userKey: args.userKey,
      prompt: args.prompt,
      createdAt: args.createdAt,
      updatedAt: args.createdAt,
    })
  },
})

export const markGenerationSuccess = internalMutation({
  args: {
    id: v.id("imageGenerations"),
    imageDataUrl: v.string(),
    completedAt: v.number(),
  },
  handler: async (ctx, { id, imageDataUrl, completedAt }) => {
    await ctx.db.patch(id, {
      imageDataUrl,
      error: undefined,
      updatedAt: completedAt,
    })
  },
})

export const markGenerationFailure = internalMutation({
  args: {
    id: v.id("imageGenerations"),
    error: v.string(),
    completedAt: v.number(),
  },
  handler: async (ctx, { id, error, completedAt }) => {
    await ctx.db.patch(id, {
      error,
      imageDataUrl: undefined,
      updatedAt: completedAt,
    })
  },
})

export const generate = action({
  args: {
    prompt: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, { prompt, sessionId }) => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      throw new Error("Prompt cannot be empty")
    }

    if (trimmedPrompt.length > 500) {
      throw new Error("Prompt is too long (max 500 characters)")
    }

    const apiKey = process.env.BANANA_API_KEY
    const apiUrl =
      process.env.BANANA_API_URL ?? "https://banananano.ai/api/generate"

    if (!apiKey) {
      throw new Error("BANANA_API_KEY is not configured")
    }

    const userKey = await resolveUserKey(ctx.auth.getUserIdentity, sessionId)
    const startedAt = Date.now()

    const generationId = await ctx.runMutation(
      internal.image.createGenerationRecord,
      {
        userKey,
        prompt: trimmedPrompt,
        createdAt: startedAt,
      },
    )

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Image provider request failed with ${response.status}: ${errorText}`,
        )
      }

      const payload = (await response.json()) as ImageProviderResponse

      if (payload.error) {
        throw new Error(payload.error)
      }

      const imageData = normalizeImageData(payload)

      if (!imageData) {
        throw new Error("Image provider response did not include image data")
      }

      await ctx.runMutation(internal.image.markGenerationSuccess, {
        id: generationId,
        imageDataUrl: imageData,
        completedAt: Date.now(),
      })

      return {
        generationId,
        imageDataUrl: imageData,
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown generation error"

      await ctx.runMutation(internal.image.markGenerationFailure, {
        id: generationId,
        error: message,
        completedAt: Date.now(),
      })

      throw error
    }
  },
})
