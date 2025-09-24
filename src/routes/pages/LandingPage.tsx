import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useConvexAuth } from "convex/react"
import { Github, UserRound, WandSparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import genLogo from "../../../public/gen-logo.png"

type AuthActionProps = {
  isAuthenticated: boolean
  isLoading: boolean
}

function SiteBrand() {
  return (
    <Link
      to="/"
      // className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-4 py-1 text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      aria-label="Go to gen.new home page"
    >
      <img src={genLogo} alt="gen.new" className="w-20 h-15 rounded-2xl" />
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      toast.error("Enter prompt first")
      return
    }

    // For now, just navigate to sign-in with the prompt
    // Later you can modify this to handle the generation
    navigate("/auth", { state: { prompt: trimmedPrompt } })
    toast.info({
      title: "Sign in required",
      description: "Sign in to start generating your free images.",
    })
  }

  return (
    <div className="min-h-dvh text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0e0d0d] to-[#2d2d2d]" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <header className="w-[95%] mx-auto relative z-10">
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
      <main className="flex-1 flex items-start mt-[9em] justify-center px-4 relative z-10">
        <div className="w-full max-w-[620px] space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-display font-[500]">
              Generate Any Image in Seconds
            </h1>
            <p className="text-white/90 max-w-[80%] mx-auto md:text-2xl text-lg font-display font-[400]">
              Create your vision ideas using the{" "}
              <a
                href="https://banananano.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 transition-colors"
              >
                {" "}
                Nano Banana model by Google
              </a>
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 max-w-[420px] mx-auto"
          >
            <Input
              type="text"
              leadingIcon={<WandSparkles className="size-4" aria-hidden />}
              placeholder="Create anything from here..."
              autoComplete="off"
              autoCapitalize="none"
              aria-describedby="prompt-help"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full font-display"
            />
            {/* <Button type="submit" className="w-full">
              Generate
            </Button> */}
          </form>

          {/* {!isLoading && !isAuthenticated ? (
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
          ) : null} */}
        </div>
      </main>
    </div>
  )
}
