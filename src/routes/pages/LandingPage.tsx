import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useConvexAuth } from "convex/react"
import { UserRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type AuthActionProps = {
  isAuthenticated: boolean
  isLoading: boolean
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      // For now, just navigate to sign-in with the prompt
      // Later you can modify this to handle the generation
      navigate("/auth", { state: { prompt } })
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="border-b border-border/40">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-end px-4 py-4 sm:px-6 lg:px-8">
          <AuthAction isAuthenticated={isAuthenticated} isLoading={isLoading} />
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
    </div>
  )
}
