import { defineApp } from "convex/server"
import betterAuth from "@convex-dev/better-auth/convex.config"
import resend from "@convex-dev/resend/convex.config"
import crons from "@convex-dev/crons/convex.config"

const app = defineApp()
app.use(betterAuth)
app.use(resend)
app.use(crons)

export default app
