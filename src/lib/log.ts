export type LogLevel = 'info' | 'warn' | 'error'

export type LogOptions = {
  context?: Record<string, unknown>
  level?: LogLevel
}

const LOG_ENDPOINT = '/api/log'

const logInDev = (message: string, options?: LogOptions) => {
  if (!import.meta.env.DEV) return

  const level = options?.level ?? 'info'
  const handler = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  handler(`[client-log] ${message}`, options?.context)
}

export const log = async (message: string, options?: LogOptions) => {
  if (!message) return

  logInDev(message, options)

  if (typeof fetch !== 'function') return

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        message,
        context: options?.context,
        level: options?.level,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[client-log] failed to forward log to Vercel', error)
    }
  }
}
