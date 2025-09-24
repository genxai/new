import { v } from "convex/values"
import { query, mutation, action } from "./_generated/server"
import { api } from "./_generated/api"
import { createGateway, generateText } from "ai"

const google = createGateway({
  apiKey: "",
})

export const generateImage = action({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    const generationId: any = await ctx.runMutation(
      api.images.createGeneration,
      {
        prompt: args.prompt,
      },
    )

    try {
      const result = await generateText({
        model: google("google/gemini-2.5-flash-image-preview"),
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
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    // const identity = await ctx.auth.getUserIdentity()
    // if (!identity) throw new Error("Not authenticated")
    // const userId = identity.subject

    return await ctx.db.insert("imageGenerations", {
      userId: "anonymous",
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
  args: {},
  handler: async (ctx) => {
    const generations = await ctx.db
      .query("imageGenerations")
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
