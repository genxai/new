import { createHash } from "node:crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createConvexRateLimitStorage } from "./rateLimitStorage"

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex")
const hashIp = (ip: string) => createHash("sha256").update(ip).digest("hex")

function splitKey(raw: string) {
  const slashIndex = raw.indexOf("/")
  const ip = slashIndex > -1 ? raw.slice(0, slashIndex) : raw
  const path = slashIndex > -1 ? raw.slice(slashIndex) || "/" : "/"
  return { ip, path }
}

describe("createConvexRateLimitStorage", () => {
  const runQuery = vi.fn()
  const runMutation = vi.fn()
  const secondaryStorage = {
    get: vi.fn(),
    set: vi.fn(),
  }

  const ctx = {
    runQuery,
    runMutation,
    options: {
      secondaryStorage,
    },
  }

  beforeEach(() => {
    runQuery.mockReset()
    runMutation.mockReset()
    secondaryStorage.get.mockReset()
    secondaryStorage.set.mockReset()
  })

  it("persists new rate limit entries and reads them back", async () => {
    runMutation.mockResolvedValueOnce(null)

    const storage = createConvexRateLimitStorage(ctx as any)
    const rawKey = "203.0.113.5/sign-in/email"
    await storage.set(rawKey, {
      key: rawKey,
      count: 1,
      lastRequest: 1_000,
    })

    const expectedKey = hashKey(rawKey)
    const { ip, path } = splitKey(rawKey)
    expect(runMutation).toHaveBeenCalledWith(expect.anything(), {
      key: expectedKey,
      ipHash: hashIp(ip),
      path,
      value: {
        count: 1,
        lastRequest: 1_000,
      },
      update: false,
    })

    runQuery.mockResolvedValueOnce({
      key: expectedKey,
      ipHash: hashIp(ip),
      path,
      count: 1,
      lastRequest: 1_000,
    })

    const result = await storage.get(rawKey)
    expect(result).toEqual({
      key: expectedKey,
      count: 1,
      lastRequest: 1_000,
    })
  })

  it("increments counts for burst requests via update flag", async () => {
    runMutation.mockResolvedValue(null)
    const storage = createConvexRateLimitStorage(ctx as any)

    const rawKey = "203.0.113.5/sign-up/email"
    await storage.set(rawKey, {
      key: rawKey,
      count: 1,
      lastRequest: 1_000,
    })

    await storage.set(
      rawKey,
      {
        key: rawKey,
        count: 2,
        lastRequest: 1_005,
      },
      true,
    )

    const expectedKey = hashKey(rawKey)
    const { ip, path } = splitKey(rawKey)

    expect(runMutation).toHaveBeenNthCalledWith(1, expect.anything(), {
      key: expectedKey,
      ipHash: hashIp(ip),
      path,
      value: {
        count: 1,
        lastRequest: 1_000,
      },
      update: false,
    })
    expect(runMutation).toHaveBeenNthCalledWith(2, expect.anything(), {
      key: expectedKey,
      ipHash: hashIp(ip),
      path,
      value: {
        count: 2,
        lastRequest: 1_005,
      },
      update: true,
    })
  })

  it("falls back to secondary storage when Convex persistence fails", async () => {
    runMutation.mockRejectedValueOnce(new Error("db offline"))

    const storage = createConvexRateLimitStorage(ctx as any)
    const rawKey = "203.0.113.5/sign-in/email"

    await storage.set(rawKey, {
      key: rawKey,
      count: 1,
      lastRequest: 1_000,
    })

    const expectedKey = hashKey(rawKey)
    expect(secondaryStorage.set).toHaveBeenCalledWith(
      `rate-limit:${expectedKey}`,
      JSON.stringify({
        count: 1,
        lastRequest: 1_000,
      }),
    )
  })

  it("reads from secondary storage when Convex queries fail", async () => {
    runQuery.mockRejectedValueOnce(new Error("db offline"))
    secondaryStorage.get.mockResolvedValueOnce(
      JSON.stringify({ count: 4, lastRequest: 2_000 }),
    )

    const storage = createConvexRateLimitStorage(ctx as any)
    const rawKey = "203.0.113.5/otp"
    const value = await storage.get(rawKey)

    const expectedKey = hashKey(rawKey)
    expect(secondaryStorage.get).toHaveBeenCalledWith(
      `rate-limit:${expectedKey}`,
    )
    expect(value).toEqual({
      key: expectedKey,
      count: 4,
      lastRequest: 2_000,
    })
  })
})
