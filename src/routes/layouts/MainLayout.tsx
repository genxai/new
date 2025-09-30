import { useState, useEffect, type ReactNode } from "react"
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom"
import { useConvexAuth } from "convex/react"
import LogoIcon from "@/components/ui/logo-icon"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { sections, getColorFromGradient, type Section } from "@/data/sections"
import { Github, UserRound } from "lucide-react"

export default function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useConvexAuth()

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

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col">
      <main
        className="flex-1 flex flex-col w-[98%] rounded-2xl mx-auto mt-3 min-h-0 bg-main-background"
        style={{ boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.08)" }}
      >
        <Outlet />
      </main>

      <nav className="w-[calc(100%-2%)] mx-auto px-4 py-2 flex items-center gap-2">
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

        <div className="flex-1 flex items-center justify-center gap-12">
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
