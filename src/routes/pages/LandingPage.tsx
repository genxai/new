import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
                Nano Banana model
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
              Get Started
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                onClick={() => navigate("/sign-in")}
                className="p-0 h-auto"
              >
                Sign in
              </Button>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
