import { v } from "convex/values"
import { internalMutation } from "../_generated/server"
import { createAuth } from "../auth"

export const createUser = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password, username } = args
    const newUser = await createAuth(ctx).api.createUser({
      body: {
        email,
        password,
        name: username,
        data: {
          emailVerified: true,
        },
      },
    })
    return newUser
  },
})
