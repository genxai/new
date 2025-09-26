import { resolveAppUrl } from "@/lib/app-url"

export function resolveVerificationSuccessUrl() {
  return resolveAppUrl("/auth/verification-success")
}
