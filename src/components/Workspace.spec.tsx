import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { ThemeProvider } from "@/providers/theme-provider"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router-dom"

import Workspace from "./Workspace"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"

const navigateMock = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn(),
  },
}))

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}))

type MockUser = {
  email: string
  image: string | null
  name: string | null
}

describe("Workspace", () => {
  const mockUseQuery = vi.mocked(useQuery)

  beforeEach(() => {
    mockUseQuery.mockReset()
    navigateMock.mockReset()
    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(() => false),
    })) as unknown as typeof window.matchMedia
    document.documentElement.classList.remove("light", "dark")
    mockUseQuery.mockImplementation(() => undefined)
  })

  it("renders a fallback initial and heading when the user is missing a name", () => {
    mockUseQuery
      .mockReturnValueOnce({
        email: "person@gen.new",
        image: null,
        name: null,
      } satisfies MockUser)
      .mockReturnValueOnce({
        usernameDisplay: "Person",
        usernameLower: "person",
      })
      .mockReturnValueOnce({
        imageTotal: 1,
        completed: 1,
        textCount: 2,
      })

    render(
      <MemoryRouter>
        <ThemeProvider>
          <Workspace />
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText("P")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument()
    expect(screen.getByText("person@gen.new")).toBeInTheDocument()
    expect(
      screen.getByRole("img", { name: "person@gen.new" }),
    ).toBeInTheDocument()
    expect(screen.queryByText("Delete account")).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /username/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/your current username is person/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /usage limits/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/text messages/i, { selector: "dt" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/you've used 2 of 10 text messages/i)).toBeInTheDocument()
    expect(screen.getByText(/2 \/ 10 used/i)).toBeInTheDocument()
    expect(screen.getByText(/1 \/ 10 used/i)).toBeInTheDocument()
    expect(screen.getByText(/8 left today/i)).toBeInTheDocument()
    expect(screen.getByText(/9 left today/i)).toBeInTheDocument()
    expect(screen.getByText(/limits reset every day/i)).toBeInTheDocument()
  })
})
