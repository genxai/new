import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider } from "@/providers/theme-provider"
import Settings from "./Settings"
import { api } from "@/convex/api"

const useQueryMock = vi.fn()
const useMutationMock = vi.fn()

vi.mock("convex/react", () => ({
  useQuery: (query: unknown) => useQueryMock(query),
  useMutation: (mutation: unknown) => useMutationMock(mutation),
}))

const navigateMock = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe("Settings", () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useQueryMock.mockReset()
    useMutationMock.mockReset()
    useMutationMock.mockReturnValue(vi.fn())
    useQueryMock.mockImplementation(() => undefined)
    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(() => false),
    })) as unknown as typeof window.matchMedia
    document.documentElement.classList.remove("light", "dark")
  })

  it("renders tabs and navigates back to settings", () => {
    useQueryMock
      .mockReturnValueOnce({
        email: "person@gen.new",
        image: null,
      })
      .mockReturnValueOnce({
        usernameDisplay: "Person",
        usernameLower: "person",
      })
      .mockReturnValueOnce({
        imageTotal: 1,
        completed: 1,
        textCount: 2,
      })
      .mockReturnValueOnce({
        hasPassphrase: true,
        twoFactorEnabled: false,
        risks: [],
      })

    render(
      <ThemeProvider>
        <Settings />
      </ThemeProvider>,
    )

    const backButton = screen.getByRole("button", {
      name: /back to settings/i,
    })

    expect(backButton).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /username/i })).toBeInTheDocument()
    expect(
      screen.getByText(/your current username is person/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /usage limits/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/text messages/i, { selector: "dt" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/image generations/i, { selector: "dt" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/you've used 2 of 10 text messages/i)).toBeInTheDocument()
    expect(screen.getByText(/2 \/ 10 used/i)).toBeInTheDocument()
    expect(screen.getByText(/1 \/ 10 used/i)).toBeInTheDocument()
    expect(screen.getByText(/8 left today/i)).toBeInTheDocument()
    expect(screen.getByText(/9 left today/i)).toBeInTheDocument()
    expect(screen.getByText(/limits reset every day/i)).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Profile" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Security" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Privacy" })).toBeInTheDocument()

    fireEvent.click(backButton)

    expect(navigateMock).toHaveBeenCalledWith("/settings")
  })
})
