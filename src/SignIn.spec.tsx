import "@testing-library/jest-dom/vitest"
import { useEffect, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"

import SignIn from "@/SignIn"
import { ThemeProvider } from "@/providers/theme-provider"

const useConvexAuthMock = vi.fn()
const sendVerificationOtpMock = vi.fn()
const signInEmailOtpMock = vi.fn()
const signInEmailPasswordMock = vi.fn()
const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
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
    signIn: {
      emailOtp: (args: unknown, options?: any) =>
        signInEmailOtpMock(args, options),
      email: (args: unknown, options?: any) =>
        signInEmailPasswordMock(args, options),
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
  Button: ({ children, ...props }: any) => (
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
  signInEmailPasswordMock.mockReset()
  toastSuccessMock.mockReset()
  toastErrorMock.mockReset()

  useConvexAuthMock.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
  })

  sendVerificationOtpMock.mockImplementation(
    async (_args: unknown, options) => {
      options?.onRequest?.()
      options?.onSuccess?.()
    },
  )

  signInEmailOtpMock.mockImplementation(async (_args: unknown, options) => {
    options?.onRequest?.()
    options?.onSuccess?.()
  })

  signInEmailPasswordMock.mockImplementation(
    async (_args: unknown, options) => {
      options?.onRequest?.()
      options?.onSuccess?.()
    },
  )

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
  it("redirects authenticated users to home", async () => {
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
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </>,
    )

    await waitFor(() => {
      expect(currentPath).toBe("/")
    })
  })

  it("validates email before sending a verification code", async () => {
    renderWithProviders(<SignIn />)

    const otpPanel = screen.getByRole("tabpanel", { name: /email code/i })

    fireEvent.change(within(otpPanel).getByLabelText(/email/i), {
      target: { value: "invalid" },
    })

    const sendButton = within(otpPanel).getByRole("button", {
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

    const otpPanel = screen.getByRole("tabpanel", { name: /email code/i })

    fireEvent.change(within(otpPanel).getByLabelText(/email/i), {
      target: { value: "ada@gen.new" },
    })

    const sendButton = within(otpPanel).getByRole("button", {
      name: /send verification code/i,
    })

    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(sendVerificationOtpMock).toHaveBeenCalledTimes(1)
      const [payload] = sendVerificationOtpMock.mock.calls[0] ?? []
      expect(payload).toMatchObject({
        email: "ada@gen.new",
        type: "sign-in",
      })
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Verification code sent. Check your email.",
      )
    })

    expect(
      within(otpPanel).getByLabelText(/verification code/i),
    ).toBeInTheDocument()
  })

  it("verifies the code after it has been sent", async () => {
    renderWithProviders(<SignIn />)

    const otpPanel = screen.getByRole("tabpanel", { name: /email code/i })

    fireEvent.change(within(otpPanel).getByLabelText(/email/i), {
      target: { value: "ada@gen.new" },
    })

    fireEvent.click(
      within(otpPanel).getByRole("button", {
        name: /send verification code/i,
      }),
    )

    await waitFor(() => {
      expect(sendVerificationOtpMock).toHaveBeenCalled()
    })

    fireEvent.change(within(otpPanel).getByLabelText(/verification code/i), {
      target: { value: "123456" },
    })

    fireEvent.click(
      within(otpPanel).getByRole("button", { name: /verify code/i }),
    )

    await waitFor(() => {
      expect(signInEmailOtpMock).toHaveBeenCalledTimes(1)
      const [payload] = signInEmailOtpMock.mock.calls[0] ?? []
      expect(payload).toMatchObject({
        email: "ada@gen.new",
        otp: "123456",
      })
      expect(toastErrorMock).not.toHaveBeenCalled()
    })
  })

  it("requires the verification code before submitting", async () => {
    renderWithProviders(<SignIn />)

    const otpPanel = screen.getByRole("tabpanel", { name: /email code/i })

    fireEvent.change(within(otpPanel).getByLabelText(/email/i), {
      target: { value: "ada@gen.new" },
    })

    fireEvent.click(
      within(otpPanel).getByRole("button", {
        name: /send verification code/i,
      }),
    )

    await waitFor(() => {
      expect(sendVerificationOtpMock).toHaveBeenCalled()
    })

    fireEvent.click(
      within(otpPanel).getByRole("button", { name: /verify code/i }),
    )

    await waitFor(() => {
      expect(signInEmailOtpMock).not.toHaveBeenCalled()
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Enter the verification code.",
      )
    })
  })

  it("signs in with password when selected", async () => {
    renderWithProviders(<SignIn />)

    fireEvent.click(screen.getByRole("tab", { name: /password/i }))

    const passwordPanel = screen.getByRole("tabpanel", {
      name: /password/i,
    })

    fireEvent.change(
      within(passwordPanel).getByLabelText(/email/i),
      {
        target: { value: "ada@gen.new" },
      },
    )

    fireEvent.change(
      within(passwordPanel).getByLabelText(/password/i),
      {
        target: { value: "hunter200" },
      },
    )

    fireEvent.click(
      within(passwordPanel).getByRole("button", { name: /sign in/i }),
    )

    await waitFor(() => {
      expect(signInEmailPasswordMock).toHaveBeenCalledTimes(1)
    })

    const [payload] = signInEmailPasswordMock.mock.calls[0] ?? []
    expect(payload).toMatchObject({
      email: "ada@gen.new",
      password: "hunter200",
    })
  })
})
