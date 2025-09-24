export type LogLevel = "info" | "warn" | "error"

export type LogPayload = {
  message?: string
  context?: Record<string, unknown>
  level?: LogLevel
  timestamp?: string
}

type VercelRequest = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[]>
}

type VercelResponse = {
  status: (statusCode: number) => VercelResponse
  json: (data: unknown) => void
  setHeader?: (name: string, value: string) => void
}

const parsePayload = (body: unknown): LogPayload | null => {
  if (!body) return null

  if (typeof body === "string") {
    try {
      return JSON.parse(body) as LogPayload
    } catch {
      return { message: body }
    }
  }

  if (typeof body === "object") {
    return body as LogPayload
  }

  return null
}

const formatContext = (context: Record<string, unknown> | undefined) => {
  if (!context) return ""
  try {
    return JSON.stringify(context)
  } catch {
    return "[unserializable context]"
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const payload = parsePayload(req.body)

  if (!payload || !payload.message) {
    res.status(400).json({ error: "Missing log message" })
    return
  }

  const level = payload.level ?? "info"
  const contextString = formatContext(payload.context)
  const timestamp = payload.timestamp ?? new Date().toISOString()
  const prefix = `[client-log] ${timestamp}`
  const logLine = contextString
    ? `${prefix} ${payload.message} ${contextString}`
    : `${prefix} ${payload.message}`

  if (level === "error") {
    console.error(logLine)
  } else if (level === "warn") {
    console.warn(logLine)
  } else {
    console.log(logLine)
  }

  res.status(200).json({ ok: true })
}
