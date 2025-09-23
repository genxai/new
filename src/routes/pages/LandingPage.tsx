import { useEffect, useMemo, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAction, useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const SESSION_STORAGE_KEY = "imageGeneration.sessionId"
const GUEST_USAGE_KEY = "imageGeneration.guestUsed"

const ensureSessionId = () => {
  if (typeof window === "undefined") {
    return null
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const fresh = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
  window.localStorage.setItem(SESSION_STORAGE_KEY, fresh)
  return fresh
}

const readGuestUsage = () => {
  if (typeof window === "undefined") {
    return false
  }
  return window.localStorage.getItem(GUEST_USAGE_KEY) === "true"
}

const markGuestUsage = () => {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(GUEST_USAGE_KEY, "true")
}

export default function LandingPage() {
  const [prompt, setPrompt] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [guestUsed, setGuestUsed] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const { isAuthenticated } = useConvexAuth()
  const navigate = useNavigate()
  const generateImage = useAction(api.image.generate)

  useEffect(() => {
    const id = ensureSessionId()
    setSessionId(id)
    setGuestUsed(readGuestUsage())
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setGuestUsed(false)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(GUEST_USAGE_KEY)
      }
    }
  }, [isAuthenticated])

  const recentArgs = useMemo(() => {
    if (!sessionId) {
      return "skip" as const
    }
    return {
      sessionId,
      limit: 1,
    }
  }, [sessionId])

  const recent = useQuery(api.image.recent, recentArgs)

  useEffect(() => {
    if (!Array.isArray(recent)) {
      return
    }

    if (recent.length > 0) {
      const [latest] = recent
      setGeneratedImage(latest.imageDataUrl ?? null)
      return
    }

    setGeneratedImage(null)
  }, [recent])

  const canGenerate = Boolean(
    sessionId && (isAuthenticated || !guestUsed),
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt) {
      setError("Please enter a prompt to generate an image")
      return
    }

    if (trimmedPrompt.length > 500) {
      setError("Prompts can be at most 500 characters")
      return
    }

    if (!sessionId) {
      setError("Session initialisation in progress. Please try again in a moment.")
      return
    }

    if (!isAuthenticated && guestUsed) {
      navigate("/sign-in", { state: { prompt: trimmedPrompt } })
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const result = await generateImage({ prompt: trimmedPrompt, sessionId })
      if (result?.imageDataUrl) {
        setGeneratedImage(result.imageDataUrl)
      }
      if (!isAuthenticated) {
        markGuestUsage()
        setGuestUsed(true)
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Something went wrong"
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Generate any image</h1>
            <p className="text-muted-foreground">
              Powered by
              <a
                href="https://banananano.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 underline underline-offset-4 hover:text-blue-500"
              >
                Nano Banana model
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Describe the image you want to see"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="w-full"
              disabled={isGenerating}
              autoComplete="off"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={!canGenerate || isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
            {!isAuthenticated && guestUsed && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/sign-in", { state: { prompt } })}
              >
                Sign in to generate more images
              </Button>
            )}
          </form>

          {error && (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="space-y-3 rounded-lg border bg-muted/20 p-6 shadow-sm">
            <p className="text-sm text-muted-foreground text-center">
              {generatedImage
                ? "Here is your most recent image. Generate another prompt to refresh it."
                : "Kick things off by describing the image you would like to create."}
            </p>
            {generatedImage ? (
              <img
                src={generatedImage}
                alt={prompt ? `Generated from: ${prompt}` : "Generated image"}
                className="mx-auto max-h-[420px] w-full rounded-md object-contain"
              />
            ) : (
              <div className="mx-auto flex h-48 w-full max-w-md items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                Image preview will appear here
              </div>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            You get 1 image generation without authentication. To get more,
            please
            <Link
              to="/sign-in"
              className="ml-1 text-blue-600 underline hover:text-blue-800"
            >
              sign in
            </Link>
            .
          </div>
        </div>
      </main>
    </div>
  )
}
