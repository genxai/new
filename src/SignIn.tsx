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
import { authClient } from "@/lib/auth-client"
import { toast } from "@/lib/toast"
import { SessionFallback } from "@/routes/guards"
import { SignInSchema, type SignInValues } from "../shared/auth-schemas"
import { pickIdentityPreviewSample } from "../shared/identity"
import { PublicPageShell } from "@/components/PublicPageShell"
import { resolveVerificationSuccessUrl } from "@/lib/verification"

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
  const navigate = useNavigate()
  const verificationSuccessUrl = resolveVerificationSuccessUrl()
  const emailValue = form.watch("email")

  useEffect(() => {
    if (isLoading) {
      return
    }
    if (isAuthenticated) {
      navigate("/settings", { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const sendVerificationCode = async () => {
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

  if (isLoading) {
    return <SessionFallback />
  }

  return (
    <PublicPageShell
      contentClassName="py-6 sm:py-10"
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
              Sign in with your email. We&apos;ll send you a verification code
              to finish signing in.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
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
                    disabled={sendingCode || !emailValue}
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
                    Send verification code
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
