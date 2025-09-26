export function resolveAppUrl(path: string) {
  const baseUrl =
    import.meta.env.VITE_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "")

  if (!baseUrl) {
    return path
  }

  try {
    return new URL(path, baseUrl).toString()
  } catch {
    return path
  }
}
