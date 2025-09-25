import { useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation } from "convex/react"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { api } from "@/convex/api"
import {
  usernameDisplaySchema,
  USERNAME_TAKEN_ERROR,
} from "../../../../shared/identity"

const usernameFormSchema = z.object({
  username: usernameDisplaySchema,
})

type UsernameFormValues = z.infer<typeof usernameFormSchema>

type UsernameFormProps = {
  initialUsername?: string | null
  description?: string
  buttonLabel?: string
  dataTestId?: string
  autoFocus?: boolean
}

export default function UsernameForm({
  initialUsername = "",
  description = "Letters and digits only.",
  buttonLabel = "Save username",
  dataTestId = "username-form",
  autoFocus = false,
}: UsernameFormProps) {
  const updateUsername = useMutation(api.identity.updateUsername)
  const normalizedInitial = initialUsername ?? ""

  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: { username: normalizedInitial },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  })

  useEffect(() => {
    form.reset({ username: normalizedInitial })
  }, [normalizedInitial, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.username === normalizedInitial) {
      toast.info("You're already using this username.")
      return
    }

    try {
      await updateUsername({ display: values.username })
      toast.success("Username updated.")
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined
      if (message === USERNAME_TAKEN_ERROR) {
        form.setError("username", {
          type: "server",
          message,
        })
        form.setFocus("username")
        toast.error("Username taken. Try another.")
        return
      }
      toast.error("Could not update username. Try again.")
    }
  })

  return (
    <Form {...form}>
      <form
        data-testid={dataTestId}
        className="space-y-4"
        onSubmit={onSubmit}
        noValidate
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoFocus={autoFocus}
                />
              </FormControl>
              <FormDescription>{description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {buttonLabel}
        </Button>
      </form>
    </Form>
  )
}

export { usernameFormSchema }
