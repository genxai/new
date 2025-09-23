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

import SignIn from "@/SignIn"
import { ThemeProvider } from "@/providers/theme-provider"

const useConvexAuthMock = vi.fn()
const sendVerificationOtpMock = vi.fn()
const signInEmailOtpMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()

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
    signIn: {
      emailOtp: (args: unknown, options?: any) =>
        signInEmailOtpMock(args, options),
    },
    emailOtp: {
      sendVerificationOtp: (args: unknown, options?: any) =>
        sendVerificationOtpMock(args, options),
    },
  },
}))

vi.mock("@/lib/toast", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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
  { initialEntries = ["/auth"] }: { initialEntries?: string[] } = {},
) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  useConvexAuthMock.mockReset()
  sendVerificationOtpMock.mockReset()
  signInEmailOtpMock.mockReset()
  toastSuccessMock.mockReset()
  toastErrorMock.mockReset()

  useConvexAuthMock.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
  })

  sendVerificationOtpMock.mockImplementation(async (_args: unknown, options) => {
    options?.onRequest?.()
    options?.onSuccess?.()
  })

  signInEmailOtpMock.mockImplementation(async (_args: unknown, options) => {
    options?.onRequest?.()
    options?.onSuccess?.()
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
})

afterEach(() => {
  cleanup()
})

describe("SignIn", () => {
  it("redirects authenticated users to the workspace", async () => {
    useConvexAuthMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    let currentPath = "/auth"

    renderWithProviders(
      <>
        <LocationObserver onChange={(pathname) => (currentPath = pathname)} />
        <Routes>
          <Route path="/auth" element={<SignIn />} />
          <Route path="/workspace" element={<div>workspace</div>} />
        </Routes>
      </>,
    )

    await waitFor(() => {
      expect(currentPath).toBe("/workspace")
    })
  })

  it("validates email before sending a verification code", async () => {
    renderWithProviders(<SignIn />)

    const sendButton = screen.getByRole("button", {
      name: /send verification code/i,
    })

    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(sendVerificationOtpMock).not.toHaveBeenCalled()
      expect(
        screen.getByText(/enter a valid email address/i),
      ).toBeInTheDocument()
    })
  })

  it("requests a verification code for a valid email", async () => {
    renderWithProviders(<SignIn />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ada@example.com" },
    })

    const sendButton = screen.getByRole("button", {
      name: /send verification code/i,
    })

    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(sendVerificationOtpMock).toHaveBeenCalledTimes(1)
      const [payload] = sendVerificationOtpMock.mock.calls[0] ?? []
      expect(payload).toMatchObject({
        email: "ada@example.com",
        type: "sign-in",
      })
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Verification code sent. Check your email.",
      )
    })

    expect(
      screen.getByLabelText(/verification code/i),
    ).toBeInTheDocument()
  })

  it("verifies the code after it has been sent", async () => {
    renderWithProviders(<SignIn />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ada@example.com" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    )

    await waitFor(() => {
      expect(sendVerificationOtpMock).toHaveBeenCalled()
    })

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: "123456" },
    })

    fireEvent.click(screen.getByRole("button", { name: /verify code/i }))

    await waitFor(() => {
      expect(signInEmailOtpMock).toHaveBeenCalledTimes(1)
      const [payload] = signInEmailOtpMock.mock.calls[0] ?? []
      expect(payload).toMatchObject({
        email: "ada@example.com",
        otp: "123456",
      })
      expect(toastErrorMock).not.toHaveBeenCalled()
    })
  })

  it("requires the verification code before submitting", async () => {
    renderWithProviders(<SignIn />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ada@example.com" },
    })

    fireEvent.click(
      screen.getByRole("button", { name: /send verification code/i }),
    )

    await waitFor(() => {
      expect(sendVerificationOtpMock).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole("button", { name: /verify code/i }))

    await waitFor(() => {
      expect(signInEmailOtpMock).not.toHaveBeenCalled()
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Enter the verification code.",
      )
    })
  })
})
