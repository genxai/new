import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useConvexAuth } from "convex/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form"
import { authClient } from "@/lib/auth-client"
import { toast } from "@/lib/toast"
import { SessionFallback } from "@/routes/guards"
import { SignUpSchema, type SignUpValues } from "../shared/auth-schemas"
import { pickIdentityPreviewSample } from "../shared/identity"
import { PublicPageShell } from "@/components/PublicPageShell"
import { PassphraseInput } from "@/components/PassphraseInput"
import { copyPassphraseToClipboard, generatePassphrase } from "@/lib/passphrase"
import { resolveVerificationSuccessUrl } from "@/lib/verification"
import {
  assertAcceptablePassphrase,
  COMPROMISED_PASSPHRASE_MESSAGE,
  evaluatePassphraseStrength,
  getPassphraseStrengthLabel,
  PassphraseValidationError,
} from "@/shared/passphrase-strength"
import { cn } from "@/lib/utils"

export default function SignUp() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const [identitySample] = useState(() => pickIdentityPreviewSample())
  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const emailValue = form.watch("email")
  const passwordValue = form.watch("password")

  const passwordEvaluation = evaluatePassphraseStrength({
    passphrase: passwordValue,
    metadata: [emailValue],
  })
  const passwordStrengthLabel = getPassphraseStrengthLabel(
    passwordEvaluation.score,
  )
  const strengthBarClass = cn(
    "h-1 rounded-full transition-all",
    passwordEvaluation.score >= 4
      ? "bg-emerald-500"
      : passwordEvaluation.score >= 2
        ? "bg-amber-500"
        : "bg-destructive",
  )
  const strengthPercentage = Math.max(
    0,
    Math.min(100, (passwordEvaluation.score / 4) * 100),
  )

  useEffect(() => {
    if (isLoading) {
      return
    }
    if (isAuthenticated) {
      navigate("/settings", { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const submitSignUp = form.handleSubmit(async (values) => {
    form.clearErrors()

    try {
      assertAcceptablePassphrase({
        passphrase: values.password,
        metadata: [values.email],
      })
    } catch (error) {
      if (error instanceof PassphraseValidationError) {
        form.setError("password", {
          type: "validation",
          message: error.message,
        })
        toast.error(error.message)
        return
      }
      throw error
    }

    const verificationSuccessUrl = resolveVerificationSuccessUrl()
    const { data, error } = await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        callbackURL: verificationSuccessUrl,
      },
      {
        onRequest: () => {
          setLoading(true)
        },
        onSuccess: () => {
          setLoading(false)
        },
        onError: () => {
          setLoading(false)
        },
      },
    )

    if (error) {
      const message =
        typeof error.message === "string"
          ? error.message
          : "We couldn't create your profile. Try again."

      if (message === COMPROMISED_PASSPHRASE_MESSAGE) {
        form.setError("password", {
          type: "server",
          message,
        })
      } else {
        form.setError("email", {
          type: "server",
          message,
        })
      }

      setLoading(false)
      toast.error(message)
      return
    }

    if (!data?.user?.id) {
      toast.error("We couldn't finish creating your profile. Try again.")
      setLoading(false)
      return
    }

    toast.info("Check your email to verify your account within 24 hours.")
    navigate("/auth/pending-verification", { replace: true })
  })

  if (isLoading) {
    return <SessionFallback />
  }

  return (
    <PublicPageShell contentClassName="py-6 sm:py-10">
      <div className="mx-auto flex h-full w-full max-w-xl items-center justify-center">
        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Use your email and a secure password. We&apos;ll send a
              verification link to finish setting things up.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form className="space-y-6" noValidate onSubmit={submitSignUp}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder={`e.g. ${identitySample.email}`}
                          required
                          autoComplete="email"
                          aria-invalid={
                            fieldState.invalid ? "true" : undefined
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel htmlFor="password">Password</FormLabel>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto px-0 py-0 text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                            onClick={async () => {
                              try {
                                const generated = generatePassphrase(24)
                                form.setValue("password", generated, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                                form.setValue("passwordConfirmation", generated, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                                await copyPassphraseToClipboard(generated)
                                toast.info(
                                  "Generated password copied to your clipboard.",
                                )
                              } catch {
                                // Silent failure per requirements.
                              }
                            }}
                          >
                            Generate
                          </Button>
                        </div>
                        <FormControl>
                          <PassphraseInput
                            {...field}
                            id="password"
                            placeholder="Password"
                            autoComplete="new-password"
                            required
                            aria-invalid={
                              fieldState.invalid ? "true" : undefined
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passwordConfirmation"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-2">
                        <FormLabel htmlFor="password-confirmation">
                          Confirm password
                        </FormLabel>
                        <FormControl>
                          <PassphraseInput
                            {...field}
                            id="password-confirmation"
                            placeholder="Confirm password"
                            autoComplete="new-password"
                            required
                            aria-invalid={
                              fieldState.invalid ? "true" : undefined
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="sm:col-span-2 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      At least 8 characters; we block weak or breached passwords automatically.
                    </div>
                    <div
                      role="status"
                      aria-live="polite"
                      className="-mx-6 px-6"
                      data-strength-score={passwordEvaluation.score}
                    >
                      <div className="h-1 w-full rounded-full bg-muted">
                        <div
                          aria-hidden="true"
                          className={strengthBarClass}
                          style={{ width: `${strengthPercentage}%` }}
                        />
                      </div>
                      <span className="sr-only">
                        Password strength: {passwordStrengthLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  ) : null}
                  Create account
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button type="button" variant="link" className="px-0" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicPageShell>
  )
}
