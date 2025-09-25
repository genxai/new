/**
 * PRE-FLIGHT: Follow AGENTS.md hard rules.
 * Workspace surface for managing account tools.
 */
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "convex/react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { Home, LogOut } from "lucide-react"
import { api } from "../../convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import UsageLimitsSection from "@/components/UsageLimitsSection"
import UsernameSettingsSection from "@/components/UsernameSettingsSection"

export default function Workspace() {
  const user = useQuery(api.auth.getCurrentUser)
  const me = useQuery(api.identity.getMe, {})
  const usageArgs = useMemo(() => ({}), [])
  const usage = useQuery(api.images.getGenerationUsage, usageArgs)

  const handleSignOut = () => {
    void authClient.signOut()
  }
  if (user === undefined || me === undefined) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!user || !me) {
    return null
  }

  const resolvedEmail = user.email?.trim() || undefined
  const displayName = resolvedEmail ?? me.usernameDisplay ?? "Account"
  const initials = (resolvedEmail ?? me.usernameDisplay ?? "?")
    .slice(0, 1)
    .toUpperCase()
  const emailLabel = resolvedEmail ?? "Email unavailable"

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link to="/" />}
            aria-label="Go to home"
          >
            <Home className="size-5" aria-hidden />
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        </div>
      </header>

      <section>
        <Card className="border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  className="size-14 border"
                  role="img"
                  aria-label={displayName}
                >
                  {user.image ? (
                    <AvatarImage src={user.image} alt={displayName} />
                  ) : (
                    <AvatarFallback aria-hidden>{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{emailLabel}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end w-full sm:w-auto">
                <ThemeToggle />
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </section>
      <section>
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <UsageLimitsSection
              usage={usage ?? null}
              isLoading={usage === undefined}
            />
          </CardContent>
        </Card>
      </section>
      <section>
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <UsernameSettingsSection username={me?.usernameDisplay ?? null} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
