import * as React from "react"
import { Input as BaseInput } from "@base-ui-components/react/input"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<typeof BaseInput> {
  inputContainerClassName?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  multiline?: boolean
  minRows?: number
  maxRows?: number
}

function Input({
  inputContainerClassName,
  className,
  type,
  leadingIcon,
  trailingIcon,
  disabled,
  multiline = false,
  minRows = 1,
  maxRows = 10,
  ...props
}: InputProps) {
  return (
    <div
      className={cn(
        "group relative w-full data-[disabled]:pointer-events-none",
        inputContainerClassName,
      )}
      data-disabled={disabled}
      data-slot="input-container"
    >
      {leadingIcon && (
        <span
          data-slot="input-leading-icon"
          className="text-muted-foreground absolute top-1/2 left-3 shrink-0 -translate-y-1/2 [&_svg]:shrink-0 [&_svg:not([class*='pointer-events-'])]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
        >
          {leadingIcon}
        </span>
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(
          "placeholder:text-muted-foreground/60 placeholder:italic selection:bg-primary group-hover:border-ring/70 selection:text-primary-foreground bg-input flex h-9 w-full min-w-0 rounded-md border text-base shadow-xs transition-[color,box-shadow,border-color] outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm",
          "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "focus:ring-1 focus:ring-ring/20 focus:shadow-offset-1",
          "aria-invalid:ring-destructive/50 aria-invalid:border-destructive",
          leadingIcon && "pl-10",
          trailingIcon && "pr-10",
          className,
        )}
        disabled={disabled}
        {...props}
      />
      {trailingIcon && (
        <span
          data-slot="input-trailing-icon"
          className="text-muted-foreground absolute placeholder:font-italic top-1/2 right-3 shrink-0 -translate-y-1/2 [&_svg]:shrink-0 [&_svg:not([class*='pointer-events-'])]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
        >
          {trailingIcon}
        </span>
      )}
    </div>
  )
}

export { Input }
