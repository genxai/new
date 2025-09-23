import { useEffect } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { AuthGate, Protected } from "@/routes/guards"
import { routes } from "@/routes/router"

const useConvexAuthMock = vi.fn()
const useQueryMock = vi.fn()

vi.mock("convex/react", async () => {
  const actual =
    await vi.importActual<typeof import("convex/react")>("convex/react")
  return {
    ...actual,
    useConvexAuth: () => useConvexAuthMock(),
    useQuery: (...args: any[]) => useQueryMock(...args),
  }
})

const authenticatedState = { isAuthenticated: true, isLoading: false }
const unauthenticatedState = { isAuthenticated: false, isLoading: false }

beforeEach(() => {
  useConvexAuthMock.mockReset()
  useQueryMock.mockReset()
})

afterEach(() => {
  cleanup()
})

function LocationObserver({
  onChange,
}: {
  onChange: (pathname: string) => void
}) {
  const location = useLocation()

  useEffect(() => {
    onChange(location.pathname)
  }, [location, onChange])

  return null
}

describe("router", () => {
  it("defines core routes in the central configuration", () => {
    const definedPaths = routes.map((route) => route.path)

    expect(definedPaths).toEqual(
      expect.arrayContaining([
        "/",
        "/auth",
        "/sign-up",
        "/settings",
        "/onboarding/username",
        "/terms",
        "/privacy",
        "*",
      ]),
    )
  })

  it("redirects root to settings when authenticated", async () => {
    useConvexAuthMock.mockReturnValue(authenticatedState)
    useQueryMock.mockImplementation(() => ({
      usernameDisplay: "Ada",
      usernameLower: "ada",
    }))
    let currentPathname = "/"

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocationObserver
          onChange={(pathname) => (currentPathname = pathname)}
        />
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/settings" element={<div>settings</div>} />
          <Route path="/auth" element={<div>auth</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(currentPathname).toBe("/settings")
    })
  })

  it("redirects root to sign-in when unauthenticated", async () => {
    useConvexAuthMock.mockReturnValue(unauthenticatedState)
    useQueryMock.mockImplementation(() => null)
    let currentPathname = "/"

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocationObserver
          onChange={(pathname) => (currentPathname = pathname)}
        />
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/settings" element={<div>settings</div>} />
          <Route path="/auth" element={<div>auth</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(currentPathname).toBe("/auth")
    })
  })

  it("redirects unauthenticated users away from protected routes", async () => {
    useConvexAuthMock.mockReturnValue(unauthenticatedState)
    useQueryMock.mockImplementation(() => null)
    let currentPathname = "/settings"

    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <LocationObserver
          onChange={(pathname) => (currentPathname = pathname)}
        />
        <Routes>
          <Route path="/auth" element={<div>auth</div>} />
          <Route path="/settings" element={<Protected />}>
            <Route index element={<div>settings</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(currentPathname).toBe("/auth")
    })
  })
})
