import { httpRouter } from "convex/server"
import { authComponent, createAuth } from "./auth"
import { polarIntegration } from "./polar"

const http = httpRouter()

authComponent.registerRoutes(http, createAuth, { cors: true })
polarIntegration.registerRoutes(http)

export default http
