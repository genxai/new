import { defineApp } from "convex/server"
import crons from "@convex-dev/crons/convex.config"
import resend from "@convex-dev/resend/convex.config"
import autumn from "@useautumn/convex/convex.config"
import betterAuth from "./betterAuth/convex.config"

const app = defineApp()
app.use(betterAuth)
app.use(resend)
app.use(crons)
app.use(autumn)

export default app
