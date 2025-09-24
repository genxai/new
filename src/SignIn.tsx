import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useConvexAuth } from "convex/react"
import { Home, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"
import { toast } from "@/lib/toast"
import { SessionFallback } from "@/routes/guards"
import {
  SignInPasswordSchema,
  SignInSchema,
  type SignInPasswordValues,
  type SignInValues,
} from "../shared/auth-schemas"
import { pickIdentityPreviewSample } from "../shared/identity"
import { PublicPageShell } from "@/components/PublicPageShell"
import { resolveVerificationSuccessUrl } from "@/lib/verification"

const COOLDOWN_SECONDS = 30
type SignInMethod = "otp" | "password"

export default function SignIn() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const [identitySample] = useState(() => pickIdentityPreviewSample())
  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  })
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [method, setMethod] = useState<SignInMethod>("otp")
  const passwordForm = useForm<SignInPasswordValues>({
    resolver: zodResolver(SignInPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const navigate = useNavigate()
  const verificationSuccessUrl = resolveVerificationSuccessUrl()
  const emailValue = form.watch("email")
  const passwordEmailValue = passwordForm.watch("email")
  const passwordValue = passwordForm.watch("password")

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setCooldownRemaining((seconds) => (seconds > 0 ? seconds - 1 : 0))
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [cooldownRemaining])

  useEffect(() => {
    if (isLoading) {
      return
    }
    if (isAuthenticated) {
      navigate("/", { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const sendVerificationCode = async () => {
    if (cooldownRemaining > 0 || sendingCode) {
      return
    }

    const isEmailValid = await form.trigger("email")
    if (!isEmailValid) {
      form.setFocus("email")
      return
    }

    const email = form.getValues("email").trim()
    let handledError = false
    try {
      await authClient.emailOtp.sendVerificationOtp(
        {
          email,
          type: "sign-in",
          callbackURL: verificationSuccessUrl,
        },
        {
          onRequest: () => {
            setSendingCode(true)
          },
          onSuccess: () => {
            setSendingCode(false)
            setOtpSent(true)
            setOtp("")
            toast.success("Verification code sent. Check your email.")
            setCooldownRemaining(COOLDOWN_SECONDS)
          },
          onError: (ctx) => {
            handledError = true
            setSendingCode(false)
            toast.error(ctx.error.message)
          },
        },
      )
    } catch (error) {
      setSendingCode(false)
      if (!handledError) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to send verification code."
        toast.error(message)
      }
    }
  }

  const verifyCode = form.handleSubmit(async ({ email }) => {
    if (!otpSent) {
      toast.info("Request a verification code first.")
      return
    }

    const trimmedOtp = otp.trim()
    if (!trimmedOtp) {
      toast.error("Enter the verification code.")
      return
    }

    let handledError = false
    try {
      await authClient.signIn.emailOtp(
        {
          email: email.trim(),
          otp: trimmedOtp,
          callbackURL: verificationSuccessUrl,
        },
        {
          onRequest: () => {
            setVerifyingCode(true)
          },
          onSuccess: () => {
            setVerifyingCode(false)
          },
          onError: (ctx) => {
            handledError = true
            setVerifyingCode(false)
            toast.error(ctx.error.message)
          },
        },
      )
    } catch (error) {
      setVerifyingCode(false)
      if (!handledError) {
        const message =
          error instanceof Error ? error.message : "Unable to verify the code."
        toast.error(message)
      }
      return
    }
  })

  const signInWithPassword = passwordForm.handleSubmit(
    async ({ email, password }) => {
      let handledError = false
      try {
        await authClient.signIn.email(
          {
            email: email.trim(),
            password,
            callbackURL: verificationSuccessUrl,
          },
          {
            onRequest: () => {
              setPasswordLoading(true)
            },
            onSuccess: () => {
              setPasswordLoading(false)
            },
            onError: (ctx) => {
              handledError = true
              setPasswordLoading(false)
              toast.error(ctx.error.message)
            },
          },
        )
      } catch (error) {
        setPasswordLoading(false)
        if (!handledError) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to sign in with your password."
          toast.error(message)
        }
      }
    },
  )

  if (isLoading) {
    return <SessionFallback />
  }

  return (
    <PublicPageShell
      contentClassName="py-6 sm:py-10"
      headerContainerClassName="mx-0 max-w-none"
      brand={
        <Button
          render={<Link to="/" />}
          variant="ghost"
          size="icon"
          aria-label="Go to home"
        >
          <Home className="size-5" aria-hidden />
        </Button>
      }
    >
      <div className="mx-auto flex h-full w-full max-w-md items-center justify-center">
        <Card className="w-full border shadow-sm">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Auth
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Sign in with your email using a one-time code or your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs
              value={method}
              onValueChange={(value) => setMethod(value as SignInMethod)}
              className="space-y-6"
            >
              <TabsList className="grid grid-cols-2 gap-2">
                <TabsTrigger value="otp">Email code</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>

              <TabsContent value="otp" className="space-y-6">
                <Form {...form}>
                  <form
                    className="space-y-6"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault()
                      void verifyCode()
                    }}
                  >
                    <div className="space-y-4">
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
                                onChange={(event) => {
                                  if (otpSent) {
                                    setOtp("")
                                    setOtpSent(false)
                                  }
                                  field.onChange(event)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {otpSent ? (
                        <div className="space-y-2">
                          <Label htmlFor="otp">Verification code</Label>
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter verification code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            required
                            value={otp}
                            onChange={(event) => {
                              setOtp(event.target.value)
                            }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="button"
                        className="w-full"
                        disabled={
                          sendingCode || cooldownRemaining > 0 || !emailValue
                        }
                        onClick={() => {
                          void sendVerificationCode()
                        }}
                      >
                        {sendingCode ? (
                          <Loader2
                            className="mr-2 size-4 animate-spin"
                            aria-hidden
                          />
                        ) : null}
                        {sendingCode
                          ? "Sending"
                          : cooldownRemaining > 0
                            ? `Resend in ${cooldownRemaining}s`
                            : "Send verification code"}
                      </Button>

                      {otpSent ? (
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={verifyingCode}
                        >
                          {verifyingCode ? (
                            <Loader2
                              className="mr-2 size-4 animate-spin"
                              aria-hidden
                            />
                          ) : null}
                          Verify code
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="password" className="space-y-6">
                <Form {...passwordForm}>
                  <form
                    className="space-y-6"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault()
                      void signInWithPassword()
                    }}
                  >
                    <div className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="email"
                        render={({ field, fieldState }) => (
                          <FormItem className="space-y-2">
                            <FormLabel htmlFor="password-email">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                id="password-email"
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

                      <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field, fieldState }) => (
                          <FormItem className="space-y-2">
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                aria-invalid={
                                  fieldState.invalid ? "true" : undefined
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        passwordLoading ||
                        !passwordEmailValue.trim() ||
                        !passwordValue.trim()
                      }
                    >
                      {passwordLoading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      ) : null}
                      Sign in
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* TODO: add later */}
          {/* <CardFooter className="flex flex-col gap-4">
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-primary">
                terms
              </a>{" "}
              and acknowledge our{" "}
              <a href="/privacy" className="underline hover:text-primary">
                privacy policy
              </a>
              .
            </p>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Button type="button" variant="link" className="px-0" asChild>
                <Link to="/sign-up">Create one</Link>
              </Button>
            </p>
          </CardFooter> */}
        </Card>
      </div>
    </PublicPageShell>
  )
}
