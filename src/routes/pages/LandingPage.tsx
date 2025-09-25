import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAction, useConvexAuth, useQuery } from "convex/react"
import { Github, Image as ImageIcon, Sparkles, UserRound } from "lucide-react"
import { Streamdown } from "streamdown"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { useClientId } from "@/hooks/useClientId"
import { FREE_GENERATION_LIMITS } from "@/shared/usage-limits"
import { api } from "../../../convex/_generated/api"

const GUEST_GENERATION_STORAGE_KEY = "gen.new.guest-generations"
const GUEST_TEXT_STORAGE_KEY = "gen.new.guest-text"
const FREE_GUEST_GENERATIONS = FREE_GENERATION_LIMITS.anonymous
const FREE_AUTH_GENERATIONS = FREE_GENERATION_LIMITS.authenticated

type ChatMessage =
  | {
      id: string
      role: "user"
      type: "text" | "image"
      content: string
      createdAt: number
    }
  | {
      id: string
      role: "assistant"
      type: "text"
      content: string
      createdAt: number
      status: "pending" | "completed" | "failed"
      error?: string
    }
  | {
      id: string
      role: "assistant"
      type: "image"
      imageUrls: string[]
      description?: string
      createdAt: number
      status: "pending" | "completed" | "failed"
      error?: string
    }

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
  const [isGenerating, setIsGenerating] = useState(false)
  const [guestGenerationCount, setGuestGenerationCount] = useState(0)
  const [guestTextCount, setGuestTextCount] = useState(0)
  const [mode, setMode] = useState<"text" | "image">("text")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const generateImage = useAction(api.images.generateImage)
  const generateTextResponse = useAction(api.images.generateTextResponse)
  const clientId = useClientId()
  const usageArgs = useMemo(
    () => ({ clientId: clientId ?? undefined }),
    [clientId],
  )
  const usageResult = useQuery(api.images.getGenerationUsage, usageArgs)
  const usage =
    usageResult ?? ({ imageTotal: 0, completed: 0, textCount: 0 } as const)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const storedImages = window.localStorage.getItem(
      GUEST_GENERATION_STORAGE_KEY,
    )
    if (storedImages) {
      const parsed = Number.parseInt(storedImages, 10)
      if (!Number.isNaN(parsed)) {
        setGuestGenerationCount(parsed)
      }
    }

    const storedText = window.localStorage.getItem(GUEST_TEXT_STORAGE_KEY)
    if (storedText) {
      const parsed = Number.parseInt(storedText, 10)
      if (!Number.isNaN(parsed)) {
        setGuestTextCount(parsed)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      toast.error("Enter prompt first")
      return
    }

    if (isGenerating) {
      return
    }

    if (mode === "image") {
      if (!isAuthenticated) {
        if (!clientId) {
          toast.info("Setting up your session, please try again.")
          return
        }

        if (guestGenerationCount >= FREE_GUEST_GENERATIONS) {
          toast.info({
            title: "Create an account",
            description: "Sign in to keep generating new images.",
          })
          navigate("/auth")
          return
        }
      } else if (usage.imageTotal >= FREE_AUTH_GENERATIONS) {
        toast.info({
          title: "Free limit reached",
          description: "You've used all free images. The limit resets in 1 day.",
        })
        return
      }
    }
    if (mode === "text") {
      const limit = isAuthenticated
        ? FREE_AUTH_GENERATIONS
        : FREE_GUEST_GENERATIONS

      if (!isAuthenticated) {
        if (!clientId) {
          toast.info("Setting up your session, please try again.")
          return
        }

        if (guestTextCount >= limit) {
          toast.info({
            title: "Create an account",
            description: "Sign in to keep the conversation going.",
          })
          navigate("/auth")
          return
        }
      } else if (usage.textCount >= limit) {
        toast.info({
          title: "Free limit reached",
          description: "You've used all free text messages. The limit resets in 1 day.",
        })
        return
      }
    }

    try {
      setIsGenerating(true)
      const now = Date.now()
      const userMessage: ChatMessage = {
        id: `user-${now}`,
        role: "user",
        type: mode,
        content: trimmedPrompt,
        createdAt: now,
      }
      if (mode === "text") {
        const assistantId = `assistant-${now}`
        const pendingAssistant: ChatMessage = {
          id: assistantId,
          role: "assistant",
          type: "text",
          content: "",
          createdAt: now + 1,
          status: "pending",
        }
        setMessages((prev) => [...prev, userMessage, pendingAssistant])

        const result = await generateTextResponse({
          prompt: trimmedPrompt,
          clientId: clientId ?? undefined,
        })

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: result.text,
                  status: "completed",
                }
              : message,
          ),
        )

        if (result.isFallback) {
          toast.info(
            "Text generation is temporarily unavailable. Try again later.",
          )
        }

        if (!isAuthenticated) {
          const nextTextCount = guestTextCount + 1
          setGuestTextCount(nextTextCount)
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              GUEST_TEXT_STORAGE_KEY,
              String(nextTextCount),
            )
          }
        }
      } else {
        if (!clientId) {
          toast.info("Setting up your session, please try again.")
          setIsGenerating(false)
          return
        }

        const assistantId = `assistant-image-${now}`
        const pendingAssistant: ChatMessage = {
          id: assistantId,
          role: "assistant",
          type: "image",
          imageUrls: [],
          description: undefined,
          createdAt: now + 1,
          status: "pending",
        }

        setMessages((prev) => [...prev, userMessage, pendingAssistant])

        const result = await generateImage({
          prompt: trimmedPrompt,
          clientId: clientId ?? undefined,
        })

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId && message.role === "assistant"
              ? {
                  ...message,
                  imageUrls: result.imageUrls,
                  description: result.description ?? message.description,
                  status: "completed",
                }
              : message,
          ),
        )

        if (!isAuthenticated) {
          const nextCount = guestGenerationCount + 1
          setGuestGenerationCount(nextCount)
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              GUEST_GENERATION_STORAGE_KEY,
              String(nextCount),
            )
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to generate response"
      toast.error(errorMessage)

      if (mode === "image") {
        setMessages((prev) =>
          prev.map((entry) =>
            entry.role === "assistant" && entry.status === "pending"
              ? { ...entry, status: "failed", error: errorMessage }
              : entry,
          ),
        )

        if (
          !isAuthenticated &&
          errorMessage.includes("Free generation limit")
        ) {
          navigate("/auth")
        }
      } else {
        setMessages((prev) =>
          prev.map((entry) =>
            entry.role === "assistant" && entry.status === "pending"
              ? { ...entry, status: "failed", error: errorMessage }
              : entry,
          ),
        )

        if (
          !isAuthenticated &&
          (errorMessage.includes("Free text generation limit") ||
            errorMessage.includes("Free generation limit"))
        ) {
          navigate("/auth")
        }
      }
    } finally {
      setIsGenerating(false)
    }

    setPrompt("")
  }

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col overflow-hidden">
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
      <main className="flex-1 flex flex-col px-4 py-10 overflow-hidden">
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Generate anything</h1>
            <p className="text-muted-foreground">
              Ask questions or generate images
            </p>
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl border border-border/50 bg-muted/10 p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full w-full flex-col items-center justify-center text-center gap-3 text-muted-foreground">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    Start the conversation
                  </p>
                  <p className="text-sm">
                    Type a question or toggle the image icon to describe what
                    you want to see.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            onClick={(event) => {
              const target = event.target as HTMLElement
              if (target.closest("input,button")) {
                return
              }
              const input = event.currentTarget.querySelector(
                "input",
              ) as HTMLInputElement | null
              input?.focus()
            }}
          >
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder={
                  mode === "text" ? "Ask anything" : "Generate image"
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1"
                disabled={isGenerating && mode === "image"}
              />
              <Button
                type="button"
                variant={mode === "image" ? "default" : "outline"}
                size="icon"
                onClick={() =>
                  setMode((prev) => (prev === "text" ? "image" : "text"))
                }
                aria-pressed={mode === "image"}
                aria-label={
                  mode === "image"
                    ? "Switch to text mode"
                    : "Switch to image mode"
                }
                className="cursor-pointer"
              >
                <ImageIcon
                  className={mode === "image" ? "text-primary-foreground" : ""}
                  aria-hidden
                />
                <span className="sr-only">
                  {mode === "image" ? "Image mode active" : "Text mode active"}
                </span>
              </Button>
            </div>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={
                isGenerating ||
                (!isAuthenticated && !clientId && mode === "image")
              }
            >
              {isGenerating
                ? mode === "image"
                  ? "Generating…"
                  : "Thinking…"
                : mode === "image"
                  ? "Generate"
                  : "Send"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  if (message.role === "assistant" && message.status === "failed") {
    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[80%] rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {message.error ?? "Unable to generate a response."}
        </div>
      </div>
    )
  }

  if (message.role === "assistant" && message.type === "image") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-3">
          <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            {message.status === "pending"
              ? "Creating your image…"
              : message.description || "Here's what I came up with."}
          </div>
          {message.status === "pending" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-transparent" />
              Generating image…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {message.imageUrls.map((url, index) => (
                <img
                  key={`${message.id}-${index}`}
                  src={url}
                  alt="Generated image"
                  className="rounded-xl border border-border/40 object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const containerClass = `flex ${isUser ? "justify-end" : "justify-start"}`
  const bubbleClass = `max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`
  const bubbleProps =
    message.role === "assistant" && message.type === "text"
      ? ({ "aria-live": message.status === "completed" ? "off" : "polite" } as const)
      : undefined

  let content: ReactNode
  if (message.role === "assistant" && message.type === "text") {
    if (message.status === "pending" && !message.content) {
      content = "…"
    } else {
      content = (
        <Streamdown className="leading-relaxed [&_*]:break-words [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background/80 [&_code]:rounded [&_code]:bg-background/60 [&_code]:px-1 [&_code]:py-0.5">
          {message.content}
        </Streamdown>
      )
    }
  } else {
    content = <p className="whitespace-pre-wrap">{message.content}</p>
  }

  return (
    <div className={containerClass}>
      <div className={bubbleClass} {...bubbleProps}>
        {content}
      </div>
    </div>
  )
}
