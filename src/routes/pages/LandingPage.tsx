import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [prompt, setPrompt] = useState("")
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      // For now, just navigate to sign-in with the prompt
      // Later you can modify this to handle the generation
      navigate("/sign-in", { state: { prompt } })
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
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

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You get 1 image generation without authentication. To get more,
              please{" "}
              <Link
                to="/sign-in"
                className="text-blue-600 underline hover:text-blue-800"
              >
                sign in
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
