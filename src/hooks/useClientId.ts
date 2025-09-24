import { useEffect, useState } from "react"

const STORAGE_KEY = "gen.new.client-id"

const createClientId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 10)
}

export function useClientId() {
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) {
      setClientId(existing)
      return
    }

    const newId = createClientId()
    window.localStorage.setItem(STORAGE_KEY, newId)
    setClientId(newId)
  }, [])

  return clientId
}
