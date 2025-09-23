import { useEffect } from "react"
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicPageShell } from "@/components/PublicPageShell"

function getErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isRouteErrorResponse(error)) {
    const statusLine = `${error.status} ${error.statusText}`.trim()
    if (typeof error.data === "string" && error.data.trim().length > 0) {
      return `${statusLine}: ${error.data}`
    }
    if (
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data
    ) {
      const message = String(error.data.message)
      return message ? `${statusLine}: ${message}` : statusLine
    }
    return statusLine
  }
  if (error instanceof Error) {
    return error.message
  }
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export default function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const message = getErrorMessage(error)

  useEffect(() => {
    if (error) {
      // Surface the original error for debugging without exposing it in the UI
      console.error("Route error", error)
    }
  }, [error])

  return (
    <PublicPageShell homeLabel="Gen.new">
      <div className="flex flex-1 items-center justify-center py-16">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We couldn't load this page. You can try again or go back home.
            </p>
            {message ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm font-mono">
                {message}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => navigate(0)}>Try again</Button>
              <Button
                variant="outline"
                onClick={() => navigate("/", { replace: true })}
              >
                Go home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicPageShell>
  )
}
