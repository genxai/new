import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAction, useConvexAuth, useQuery } from "convex/react"
import { Github, Sparkles, UserRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { api } from "../../../convex/_generated/api"

type AuthActionProps = {
  isAuthenticated: boolean
  isLoading: boolean
}

function SiteBrand() {
  return (
    <Link
      to="/"
      className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-4 py-1 text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      aria-label="Go to gen.new home page"
    >
      <span className="font-mono text-foreground">gen.new</span>
    </Link>
  )
}

function AuthAction({ isAuthenticated, isLoading }: AuthActionProps) {
  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return (
      <Button
        render={<Link to="/settings" />}
        variant="ghost"
        size="icon"
        aria-label="Open settings"
      >
        <UserRound className="size-5" aria-hidden />
      </Button>
    )
  }

  return <Button render={<Link to="/auth" />}>Sign In</Button>
}

export default function LandingPage() {
  const [prompt, setPrompt] = useState("")
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const generateImage = useAction(api.images.generateImage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      toast.error("Enter prompt first")
      return
    }

    const result = await generateImage({ prompt: trimmedPrompt })
    console.log("Image generation result:", result)

    // For now, just navigate to sign-in with the prompt
    // Later you can modify this to handle the generation
    // navigate("/auth", { state: { prompt: trimmedPrompt } })
    // toast.info({
    //   title: "Sign in required",
    //   description: "Sign in to start generating your free images.",
    // })
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="border-b border-border/40">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <SiteBrand />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open gen.new GitHub repository"
              render={({ children, ...props }) => (
                <a
                  {...props}
                  href="https://github.com/genxai/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                  <span className="sr-only">
                    Open gen.new GitHub repository
                  </span>
                </a>
              )}
            >
              <Github className="size-5" aria-hidden />
            </Button>
            <AuthAction
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Generate any image</h1>
            <p className="text-muted-foreground">
              Using{" "}
              <a
                href="https://banananano.ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                Nano Banana model by Google
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Generate an image"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full"
            />
            <Button type="submit" className="w-full">
              Generate
            </Button>
          </form>

          {!isLoading && !isAuthenticated ? (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <Link
                  to="/auth"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to start generating your free images.
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <GenerationsGrid />
    </div>
  )
}

function GenerationsGrid() {
  const generations = useQuery(api.images.getUserGenerations) || []

  if (!generations?.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-muted/30 px-8 py-14 text-center shadow-lg transition-colors dark:border-border/60 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div
            className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100"
            aria-hidden
          >
            <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 right-12 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary backdrop-blur">
              <Sparkles className="h-6 w-6" aria-hidden />
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                No images yet
              </h2>
              <p className="text-sm text-muted-foreground">
                Start with a prompt above and we'll keep your fresh generations right here.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generations.map((g) => (
          <div
            key={g._id}
            className="bg-white rounded-lg border overflow-hidden"
          >
            {/* Preview section */}
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {g.status === "pending" && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-transparent mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Generating…</p>
                </div>
              )}

              {g.status === "failed" && (
                <div className="text-center p-4">
                  <p className="text-sm text-red-500">Generation failed</p>
                  {g.error && (
                    <p className="text-xs text-gray-400 mt-1">{g.error}</p>
                  )}
                </div>
              )}

              {g.status === "completed" && g.imageUrls?.length ? (
                g.imageUrls.length === 1 ? (
                  // Single image — fill container
                  <img
                    src={g.imageUrls[0]}
                    alt={g.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  // Multiple images — small grid
                  <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
                    {g.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`${g.prompt} - ${i + 1}`}
                        className="w-full h-full object-cover rounded"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )
              ) : null}
            </div>

            {/* Info section */}
            <div className="p-4">
              <p className="text-sm font-medium text-gray-800">Prompt</p>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {g.prompt}
              </p>

              {g.description && (
                <>
                  <p className="text-sm font-medium text-gray-800">
                    Description
                  </p>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-3">
                    {g.description}
                  </p>
                </>
              )}

              <p className="text-xs text-gray-400">
                {new Date(g._creationTime).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
