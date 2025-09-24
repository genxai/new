import { v } from "convex/values"
import { query, mutation, action } from "./_generated/server"
import { api } from "./_generated/api"
import { generateText } from "ai"
import type { Id } from "./_generated/dataModel"

const FREE_GENERATION_LIMITS = {
  anonymous: 1,
  authenticated: 3,
} as const

const MAX_FREE_GENERATION_LIMIT = Math.max(
  FREE_GENERATION_LIMITS.anonymous,
  FREE_GENERATION_LIMITS.authenticated,
)

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
    })

    const limit = isAuthenticated
      ? FREE_GENERATION_LIMITS.authenticated
      : FREE_GENERATION_LIMITS.anonymous

    if (usage.total >= limit) {
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

      const storageIds: string[] = []
      for (const [, file] of imageFiles.entries()) {
        const blob = new Blob([new Uint8Array(file.uint8Array)], {
          type: file.mediaType ?? "image/png",
        })
        const storageId = await ctx.storage.store(blob)
        storageIds.push(storageId)
      }

      await ctx.runMutation(api.images.updateGeneration, {
        generationId,
        storageIds: storageIds as any[],
        status: "completed",
        description: result.text,
      })

      return { success: true, generationId }
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
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const generations = await ctx.db
      .query("imageGenerations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(MAX_FREE_GENERATION_LIMIT + 1)

    let completed = 0
    for (const generation of generations) {
      if (generation.status === "completed") {
        completed += 1
      }
    }

    return {
      total: generations.length,
      completed,
    }
  },
})
