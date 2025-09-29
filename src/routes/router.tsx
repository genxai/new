import { createBrowserRouter, type RouteObject } from "react-router-dom"
import SignIn from "@/SignIn"
import SignUp from "@/SignUp"
import WorkspacePage from "@/routes/pages/WorkspacePage"
import ClaimUsernamePage from "@/routes/pages/ClaimUsernamePage"
import NotFoundPage from "@/routes/pages/NotFoundPage"
import TermsPage from "@/routes/pages/TermsPage"
import PrivacyPage from "@/routes/pages/PrivacyPage"
import LandingPage from "@/routes/pages/LandingPage"
import { Protected } from "@/routes/guards"
import WorkspaceShell from "@/routes/layouts/WorkspaceShell"
import RouteErrorBoundary from "@/routes/RouteErrorBoundary"
import FeedbackPage from "./pages/FeedbackPage"

const baseRoutes: RouteObject[] = [
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/auth",
    Component: SignIn,
  },
  {
    path: "/sign-up",
    Component: SignUp,
  },
  {
    path: "/terms",
    Component: TermsPage,
  },
  {
    path: "/privacy",
    Component: PrivacyPage,
  },
  {
    path: "/auth/pending-verification",
    lazy: async () => ({
      Component: (await import("@/routes/pages/PendingVerificationPage"))
        .default,
    }),
  },
  {
    path: "/auth/verification-success",
    lazy: async () => ({
      Component: (await import("@/routes/pages/VerificationSuccessPage"))
        .default,
    }),
  },
  {
    path: "/feedback",
    Component: FeedbackPage,
  },
  {
    path: "/settings",
    Component: Protected,
    children: [
      {
        Component: WorkspaceShell,
        children: [
          {
            index: true,
            Component: WorkspacePage,
          },
          {
            path: "preferences",
            lazy: async () => ({
              Component: (await import("@/routes/pages/WorkspaceSettingsPage"))
                .default,
            }),
          },
        ],
      },
    ],
  },
  {
    path: "/onboarding/username",
    Component: Protected,
    children: [
      {
        index: true,
        Component: ClaimUsernamePage,
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]

const withDefaultErrorElement = (route: RouteObject): RouteObject => ({
  ...route,
  errorElement: route.errorElement ?? <RouteErrorBoundary />,
  children: route.children?.map(withDefaultErrorElement),
})

export const routes = baseRoutes.map(withDefaultErrorElement)

export const router = createBrowserRouter(routes)
