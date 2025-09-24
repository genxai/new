import "@testing-library/jest-dom/vitest"
import { useEffect, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"

import SignUp from "@/SignUp"
import { ThemeProvider } from "@/providers/theme-provider"
import { COMPROMISED_PASSPHRASE_MESSAGE } from "@/shared/passphrase-strength"

const useConvexAuthMock = vi.fn()
const {
  signUpEmailMock,
  toastErrorMock,
  toastInfoMock,
  clipboardWriteTextMock,
} = vi.hoisted(() => ({
  signUpEmailMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
  clipboardWriteTextMock: vi.fn(),
}))

vi.mock("convex/react", async () => {
  const actual =
    await vi.importActual<typeof import("convex/react")>("convex/react")
  return {
    ...actual,
    useConvexAuth: () => useConvexAuthMock(),
  }
})

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: signUpEmailMock,
    },
  },
}))

vi.mock("@/lib/toast", () => ({
  toast: {
    error: toastErrorMock,
    info: toastInfoMock,
  },
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild: _asChild, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}))

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

function renderWithProviders(
  ui: ReactNode,
  { initialEntries = ["/sign-up"] }: { initialEntries?: string[] } = {},
) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  useConvexAuthMock.mockReset()
  signUpEmailMock.mockReset()
  toastErrorMock.mockReset()
  toastInfoMock.mockReset()
  clipboardWriteTextMock.mockReset()

  useConvexAuthMock.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
  })

  signUpEmailMock.mockResolvedValue({
    data: { user: { id: "pending_user" } },
    error: null,
  })

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia

  Object.defineProperty(window.navigator, "clipboard", {
    value: {
      writeText: clipboardWriteTextMock,
    },
    configurable: true,
  })
})

afterEach(() => {
  cleanup()
})

describe("SignUp", () => {
  it("redirects authenticated users to settings", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    let currentPath = "/sign-up"

    renderWithProviders(
      <>
        <LocationObserver onChange={(pathname) => (currentPath = pathname)} />
        <Routes>
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/settings" element={<div>settings</div>} />
        </Routes>
      </>,
    )

    await waitFor(() => {
      expect(currentPath).toBe("/settings")
    })
  })

  it("renders the theme toggle for unauthenticated pages", () => {
    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    )

    expect(
      screen.getByRole("button", {
        name: /Switch to (dark|light) mode/,
      }),
    ).toBeInTheDocument()
  })

  it("prevents sign up with invalid email or short password", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    )

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "short" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "short" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument()
    const passwordErrors = await screen.findAllByText(
      "Password must be at least 8 characters.",
    )
    expect(passwordErrors).toHaveLength(2)
    expect(signUpEmailMock).not.toHaveBeenCalled()
  })

  it("shows real-time password strength feedback", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    )

    const passwordField = screen.getByLabelText("Password")
    const strengthMeter = screen.getByRole("status")

    fireEvent.change(passwordField, {
      target: { value: "aaaaaaa" },
    })

    await waitFor(() => {
      expect(strengthMeter.getAttribute("data-strength-score")).toBe("0")
      expect(strengthMeter.textContent).toMatch(/Password strength:/)
    })

    fireEvent.change(passwordField, {
      target: { value: "library-quiet-yellow-planet-92" },
    })

    await waitFor(() => {
      expect(
        strengthMeter.getAttribute("data-strength-score"),
      ).not.toBeNull()
      expect(strengthMeter.textContent).toMatch(/Password strength:/)
    })
  })

  it("surfaces compromised password errors from the server", async () => {
    signUpEmailMock.mockResolvedValue({
      data: null,
      error: { message: COMPROMISED_PASSPHRASE_MESSAGE },
    })

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    )

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@gen.new" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "library-quiet-yellow-planet-92" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "library-quiet-yellow-planet-92" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    expect(
      await screen.findByText(COMPROMISED_PASSPHRASE_MESSAGE),
    ).toBeInTheDocument()
  })

  it("requires matching passwords", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    )

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@gen.new" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different battery" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(
        screen.getByText("Passwords must match before continuing."),
      ).toBeInTheDocument()
    })
    expect(signUpEmailMock).not.toHaveBeenCalled()
  })

  it("surfaces server errors in the form", async () => {
    signUpEmailMock.mockImplementation(async (_values, options) => {
      options?.onRequest?.()
      options?.onError?.({ error: { message: "Email already in use." } })
      return { data: null, error: { message: "Email already in use." } }
    })

    renderWithProviders(
      <Routes>
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>,
    )

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@gen.new" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "correct horse battery" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(screen.getByText("Email already in use.")).toBeInTheDocument()
    })
    expect(toastErrorMock).toHaveBeenCalledWith("Email already in use.")
  })

  it("submits successfully with valid input", async () => {
    let currentPath = "/sign-up"

    renderWithProviders(
      <>
        <LocationObserver onChange={(pathname) => (currentPath = pathname)} />
        <Routes>
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/auth/pending-verification"
            element={<div>pending verification</div>}
          />
        </Routes>
      </>,
    )

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@gen.new" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "library-quiet-yellow-planet-92" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "library-quiet-yellow-planet-92" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(signUpEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "ada@gen.new",
          password: "library-quiet-yellow-planet-92",
        }),
        expect.any(Object),
      )
    })

    expect(toastInfoMock).toHaveBeenCalledWith(
      "Check your email to verify your account within 24 hours.",
    )
    await waitFor(() => {
      expect(currentPath).toBe("/auth/pending-verification")
    })
  })
})
