import UsernameForm from "@/features/settings/profile/UsernameForm"

export type UsernameSettingsSectionProps = {
  username?: string | null
}

export default function UsernameSettingsSection({
  username,
}: UsernameSettingsSectionProps) {
  const hasUsername = Boolean(username)
  const message = hasUsername
    ? `Your current username is ${username}. You can change it at any time.`
    : "Choose a username to personalize your account."

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold leading-tight">Username</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <UsernameForm initialUsername={username ?? ""} autoFocus={!hasUsername} />
    </section>
  )
}
