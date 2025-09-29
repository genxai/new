import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAction, useConvexAuth, useQuery } from "convex/react"
import LogoIcon from "@/components/ui/logo-icon"
import SettingsIcon from "@/components/ui/settings-icon"
import PlusIcon from "@/components/ui/plus-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { sections, getColorFromGradient, type Section } from "@/data/sections"
import { toast } from "@/lib/toast"
import { useClientId } from "@/hooks/useClientId"
import { FREE_GENERATION_LIMITS } from "@/shared/usage-limits"
import { api } from "../../../convex/_generated/api"
import { Sparkles, Loader2, Github, UserRound } from "lucide-react"
import { Streamdown } from "streamdown"

const GUEST_GENERATION_STORAGE_KEY = "gen.new.guest-generations"
const GUEST_TEXT_STORAGE_KEY = "gen.new.guest-text"
const FREE_GUEST_GENERATIONS = FREE_GENERATION_LIMITS.anonymous
const FREE_AUTH_GENERATIONS = FREE_GENERATION_LIMITS.authenticated

const supportedModes: Partial<Record<Section["id"], SectionMode>> = {
  image: "image",
  writing: "text",
}

const usageFallback = { imageTotal: 0, completed: 0, textCount: 0 } as const

type SectionMode = "text" | "image"

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

type SectionStateMap<T> = Record<string, T>

export default function MainPage() {
  const [promptBySection, setPromptBySection] = useState<
    SectionStateMap<string>
  >({})
  const [messagesBySection, setMessagesBySection] = useState<
    SectionStateMap<ChatMessage[]>
  >({})
  const [isGeneratingBySection, setIsGeneratingBySection] = useState<
    SectionStateMap<boolean>
  >({})
  const [guestGenerationCount, setGuestGenerationCount] = useState(0)
  const [guestTextCount, setGuestTextCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const location = useLocation()
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
  const usage = usageResult ?? usageFallback

  const isRootRoute = location.pathname === "/"
  const preferredDefaultSection = sections.find(
    (section) => section.id === "writing",
  )
  const activeSection =
    sections.find((section) =>
      isRootRoute
        ? section.id === "writing"
        : location.pathname.startsWith(section.route),
    ) ||
    (isRootRoute && preferredDefaultSection
      ? preferredDefaultSection
      : sections[0])
  const mode = supportedModes[activeSection.id] ?? null

  const prompt = promptBySection[activeSection.id] ?? ""
  const messages = messagesBySection[activeSection.id] ?? []
  const isGenerating = isGeneratingBySection[activeSection.id] ?? false

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest("[data-menu-container]")) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isMenuOpen])

  const handleSectionClick = (section: Section) => {
    if (section.id === "writing") {
      navigate("/")
      return
    }

    navigate(section.route)
  }

  const handlePromptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const sectionId = activeSection.id
    const { value } = event.target
    setPromptBySection((prev) => ({
      ...prev,
      [sectionId]: value,
    }))
  }

  const setSectionGenerating = (sectionId: string, value: boolean) => {
    setIsGeneratingBySection((prev) => ({
      ...prev,
      [sectionId]: value,
    }))
  }

  const updateMessages = (
    sectionId: string,
    updater: (prev: ChatMessage[]) => ChatMessage[],
  ) => {
    setMessagesBySection((prev) => {
      const current = prev[sectionId] ?? []
      return {
        ...prev,
        [sectionId]: updater(current),
      }
    })
  }

  const resetPrompt = (sectionId: string) => {
    setPromptBySection((prev) => ({
      ...prev,
      [sectionId]: "",
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const sectionId = activeSection.id
    const currentMode = supportedModes[sectionId] ?? null
    const trimmedPrompt = promptBySection[sectionId]?.trim() ?? ""

    if (!currentMode) {
      toast.info("That generator is coming soon.")
      return
    }

    if (!trimmedPrompt) {
      toast.error("Enter prompt first")
      return
    }

    if (isGeneratingBySection[sectionId]) {
      return
    }

    if (currentMode === "image") {
      if (!isAuthenticated && !clientId) {
        toast.info("Setting up your session, please try again.")
        return
      }

      if (isAuthenticated && usage.imageTotal >= FREE_AUTH_GENERATIONS) {
        toast.info({
          title: "Free limit reached",
          description:
            "You've used all free images. The limit resets in 1 day.",
        })
        return
      }
    }

    if (currentMode === "text") {
      const limit = isAuthenticated
        ? FREE_AUTH_GENERATIONS
        : FREE_GUEST_GENERATIONS

      if (!isAuthenticated) {
        if (!clientId) {
          toast.info("Setting up your session, please try again.")
          return
        }
      } else if (usage.textCount >= limit) {
        toast.info({
          title: "Free limit reached",
          description:
            "You've used all free text messages. The limit resets in 1 day.",
        })
        return
      }
    }

    const now = Date.now()
    setSectionGenerating(sectionId, true)

    try {
      const userMessage: ChatMessage = {
        id: `user-${now}`,
        role: "user",
        type: currentMode,
        content: trimmedPrompt,
        createdAt: now,
      }

      if (currentMode === "text") {
        const assistantId = `assistant-${now}`
        const pendingAssistant: ChatMessage = {
          id: assistantId,
          role: "assistant",
          type: "text",
          content: "",
          createdAt: now + 1,
          status: "pending",
        }

        updateMessages(sectionId, (prev) => [
          ...prev,
          userMessage,
          pendingAssistant,
        ])

        const result = await generateTextResponse({
          prompt: trimmedPrompt,
          clientId: clientId ?? undefined,
        })

        updateMessages(sectionId, (prev) =>
          prev.map((message) =>
            message.id === assistantId &&
            message.role === "assistant" &&
            message.type === "text"
              ? {
                  ...message,
                  content: result.text,
                  status: "completed",
                }
              : message,
          ),
        )

        if (result.limitReached) {
          toast.info({
            title: "Create an account",
            description: "Sign in to keep the conversation going.",
          })
        } else if (result.isFallback) {
          toast.info(
            "Text generation is temporarily unavailable. Try again later.",
          )
        }

        if (!isAuthenticated && !result.limitReached) {
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
          setSectionGenerating(sectionId, false)
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

        updateMessages(sectionId, (prev) => [
          ...prev,
          userMessage,
          pendingAssistant,
        ])

        const result = await generateImage({
          prompt: trimmedPrompt,
          clientId: clientId ?? undefined,
        })

        updateMessages(sectionId, (prev) =>
          prev.map((message) =>
            message.id === assistantId &&
            message.role === "assistant" &&
            message.type === "image"
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

      updateMessages(sectionId, (prev) =>
        prev.map((entry) =>
          entry.role === "assistant" && entry.status === "pending"
            ? { ...entry, status: "failed", error: errorMessage }
            : entry,
        ),
      )
    } finally {
      setSectionGenerating(sectionId, false)
    }

    resetPrompt(sectionId)
  }

  const promptPlaceholder =
    mode === "image"
      ? "Background of soft, abstract gradient pastels"
      : mode === "text"
        ? "Ask anything in chat"
        : "Coming soon"

  const generateLabel =
    mode === "image"
      ? isGenerating
        ? "Generating…"
        : "Generate"
      : mode === "text"
        ? isGenerating
          ? "Thinking…"
          : "Send"
        : "Coming soon"

  const isGenerateDisabled =
    !mode || isGenerating || (mode === "image" && !isAuthenticated && !clientId)

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-between px-4 py-10">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex text-xl font-extralight justify-center gap-2 mx-auto items-center h-10">
            <span
              className="scale-y-85 font-[500] bg-clip-text text-transparent flex items-center"
              style={{
                backgroundImage: `linear-gradient(to right, ${activeSection.color.replace(" ", ", ")})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              gen
            </span>
            <span className="text-foreground/80 flex items-center scale-y-85">
              a
            </span>
            <span
              className="scale-y-85 font-[500] bg-clip-text text-transparent flex items-center"
              style={{
                backgroundImage: `linear-gradient(to right, ${activeSection.color.replace(" ", ", ")})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              new
            </span>
            <span className="text-foreground/80 flex items-center scale-y-85">
              {activeSection.genName.toLowerCase()}
            </span>
          </div>

          <div className="max-w-xl mx-auto w-full">
            <div className="min-h-[260px] max-h-[460px] overflow-y-auto rounded-[24px] border border-border/40 bg-background/60 dark:bg-muted/20 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.24)] space-y-4 transition-[background-color,box-shadow]">
              {messages.length === 0 ? (
                <EmptyState mode={mode} />
              ) : (
                messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative max-w-xl mx-auto"
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
            <Input
              type="text"
              placeholder={promptPlaceholder}
              value={prompt}
              onChange={handlePromptChange}
              disabled={!mode || (mode === "image" && isGenerating)}
              className="w-full min-h-24 items-start rounded-[26px] text-lg pr-40 p-3 pb-12 border border-border/40 bg-background/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.04)] focus-visible:border-border dark:border-border/60 dark:bg-muted/20 dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] transition-[box-shadow,border-color]"
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-4">
              <Button
                variant="icon"
                size="md"
                className="h-8 w-8 rounded-full"
                type="button"
              >
                <PlusIcon />
              </Button>
              <Button
                variant="icon"
                size="md"
                className="h-8 w-8 rounded-full"
                type="button"
              >
                <SettingsIcon />
              </Button>
              <Button
                type="submit"
                size="md"
                className="text-sm font-medium text-white px-5 py-1.5 rounded-[12px] transition-all duration-200"
                style={{
                  background: `linear-gradient(to right, ${activeSection.color.replace(" ", ", ")})`,
                  boxShadow: `0px 5px 10px 0px ${getColorFromGradient(activeSection.color)}33, 0px 1px 4px 0px ${getColorFromGradient(activeSection.color)}A5, 0px -0.5px 0px 0px color(display-p3 1 1 1 / 0.10) inset, 0px 0.5px 0px 0px color(display-p3 1 1 1 / 0.20) inset`,
                }}
                disabled={isGenerateDisabled}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {generateLabel}
                  </span>
                ) : (
                  generateLabel
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <nav className="w-[calc(100%-2%)] mx-auto px-4 py-4 flex items-center gap-2">
        <div className="relative" data-menu-container>
          <Button
            variant="simpleButton"
            size="xl"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <LogoIcon style={{ width: "30px", height: "30px" }} />
          </Button>

          {isMenuOpen && (
            <div className="absolute bottom-full left-0 mb-4 bg-background border border-border/40 rounded-xl shadow-lg py-3 px-3">
              <div className="flex flex-col items-center gap-6">
                <Button
                  variant="simpleButton"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ThemeToggle />
                </Button>

                <Button
                  variant="simpleButton"
                  size="sm"
                  aria-label="Open gen.new GitHub repository"
                  render={({ children, ...props }) => (
                    <a
                      {...props}
                      href="https://github.com/genxai/new"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                      <Github className="size-4" aria-hidden />
                      GitHub
                    </a>
                  )}
                />
                <AuthAction
                  isAuthenticated={isAuthenticated}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center gap-8">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection.id === section.id

            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section)}
                className="flex flex-col items-center cursor-pointer gap-1 p-2"
              >
                <Icon
                  className="h-5 w-5 transition-colors text-muted-foreground/50"
                  style={
                    isActive
                      ? {
                          color: getColorFromGradient(section.color),
                        }
                      : undefined
                  }
                />
                <span
                  className="text-xs font-medium text-muted-foreground/50"
                  style={
                    isActive
                      ? {
                          backgroundImage: `linear-gradient(to right, ${section.color.replace(" ", ", ")})`,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                          WebkitTextFillColor: "transparent",
                        }
                      : undefined
                  }
                >
                  {section.navName}
                </span>
              </button>
            )
          })}
        </div>
        <div className="w-5"></div>
      </nav>
    </div>
  )
}

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
        size="sm"
        aria-label="Open settings"
      >
        <UserRound className="size-4" aria-hidden />
        Profile
      </Button>
    )
  }

  return (
    <Button render={<Link to="/auth" />} variant="simpleButton" size="sm">
      <UserRound className="size-4" aria-hidden />
      Sign in
    </Button>
  )
}

function EmptyState({ mode }: { mode: SectionMode | null }) {
  if (!mode) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center gap-3 text-muted-foreground">
        <span className="text-sm font-medium">
          This generator is coming soon.
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center gap-3 text-muted-foreground">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-foreground">
          {mode === "text" ? "Start chatting" : "Create something visual"}
        </p>
        <p className="text-sm">
          {mode === "text"
            ? "Ask a question or describe what you want to write."
            : "Describe the image you want to see."}
        </p>
      </div>
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
      ? ({
          "aria-live": message.status === "completed" ? "off" : "polite",
        } as const)
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
