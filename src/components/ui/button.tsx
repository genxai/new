import * as React from "react"
import { mergeProps } from "@base-ui-components/react"
import { useRender } from "@base-ui-components/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80 shadow-xs",
        signin:
          "rounded-full bg-inherit text-sm font-semibold text-foreground backdrop-blur transition-transform hover:-translate-y-[1px] hover:border-primary/60 hover:bg-primary/5 hover:text-primary focus-visible:ring-primary/40 dark:bg-background/60",
        generate: {
          background:
            "linear-gradient(180deg, color(display-p3 1 1 1 / 0.30) -32.95%, color(display-p3 1 1 1 / 0.30) -23.17%, color(display-p3 1 1 1 / 0.29) -15.22%, color(display-p3 1 1 1 / 0.28) -8.8%, color(display-p3 1 1 1 / 0.26) -3.64%, color(display-p3 1 1 1 / 0.25) 0.53%, color(display-p3 1 1 1 / 0.22) 4.01%, color(display-p3 1 1 1 / 0.20) 7.07%, color(display-p3 1 1 1 / 0.18) 9.98%, color(display-p3 1 1 1 / 0.15) 13.04%, color(display-p3 1 1 1 / 0.12) 16.51%, color(display-p3 1 1 1 / 0.10) 20.69%, color(display-p3 1 1 1 / 0.07) 25.84%, color(display-p3 1 1 1 / 0.05) 32.26%, color(display-p3 1 1 1 / 0.02) 40.22%, color(display-p3 1 1 1 / 0.00) 50%), radial-gradient(101.78% 52.64% at 50% 100%, color(display-p3 1 1 1 / 0.10) 0%, color(display-p3 1 1 1 / 0.09) 9.27%, color(display-p3 1 1 1 / 0.08) 17.04%, color(display-p3 1 1 1 / 0.07) 23.57%, color(display-p3 1 1 1 / 0.06) 29.12%, color(display-p3 1 1 1 / 0.06) 33.95%, color(display-p3 1 1 1 / 0.05) 38.32%, color(display-p3 1 1 1 / 0.05) 42.49%, color(display-p3 1 1 1 / 0.04) 46.72%, color(display-p3 1 1 1 / 0.04) 51.28%, color(display-p3 1 1 1 / 0.03) 56.42%, color(display-p3 1 1 1 / 0.03) 62.4%, color(display-p3 1 1 1 / 0.02) 69.49%, color(display-p3 1 1 1 / 0.02) 77.95%, color(display-p3 1 1 1 / 0.01) 88.03%, color(display-p3 1 1 1 / 0.00) 100%), linear-gradient(0deg, color(display-p3 0.1812 0.5534 0.4665) 0%, color(display-p3 0.1188 0.4197 0.4594) 100%)",
          boxShadow:
            "0px 5px 10px 0px color(display-p3 0.1176 0.4196 0.4588 / 0.33), 0px 1px 4px 0px color(display-p3 0.1176 0.4196 0.4588 / 0.65), 0px -0.5px 0px 0px color(display-p3 1 1 1 / 0.10) inset, 0px 0.5px 0px 0px color(display-p3 1 1 1 / 0.20) inset",
        },
        simpleButton:
          "bg-inherit border-none items-center justify-center hover:opacity-85 transition-all ease-in-out duration-200",
        icon: "bg-inherit items-center justify-center rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8),inset_1px_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.1),inset_1px_1px_2px_rgba(0,0,0,0.3)] hover:shadow-[0_3px_6px_rgba(0,0,0,0.15),inset_-1px_-1px_1px_rgba(255,255,255,0.9),inset_1px_1px_1px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_3px_6px_rgba(0,0,0,0.4),inset_-1px_-1px_1px_rgba(255,255,255,0.15),inset_1px_1px_1px_rgba(0,0,0,0.4)] transition-all duration-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
        ghost:
          "text-foreground hover:bg-accent items-center justify-center dark:hover:bg-accent/50 hover:text-accent-foreground",
        outline:
          "border bg-transparent text-foreground hover:bg-accent dark:hover:bg-accent/50 hover:text-accent-foreground shadow-xs",
        link: "text-foreground hover:underline",
        destructive:
          "bg-destructive hover:bg-destructive/80 dark:bg-destructive/80 text-destructive-foreground dark:hover:bg-destructive/60 dark:focus-visible:ring-destructive/40 focus-visible:ring-destructive/50 shadow-xs",
      },
      size: {
        sm: {
          h: "1.5rem",
          minW: "1.5rem",
          fontSize: "0.6875rem",
          px: "0.5rem",
          gap: "0.25rem",
          borderRadius: "0.4375rem",
          _icon: {
            size: "1rem",
          },
        },
        md: {
          h: "2rem",
          minW: "2rem",
          fontSize: "0.6875rem",
          px: "0.875rem",
          gap: "0.3rem",
          borderRadius: "0.5rem",
          _icon: {
            size: "1rem",
          },
        },
        lg: {
          h: "2.3125rem",
          minW: "2.3125rem",
          px: "1.25rem",
          gap: "0.5rem",
          borderRadius: "0.625rem",
        },
        xl: {
          h: "3.5em",
          minW: "3.5em",
          px: "1.25rem",
          gap: "0.5rem",
          borderRadius: "0.625rem",
        },
        mobile: {
          h: "2.75rem",
          minW: "2.75rem",
          px: "1rem",
          gap: "0.5rem",
          fontSize: "1rem",
          borderRadius: "2.5625rem",
          _icon: {
            size: "1.5rem",
          },
        },
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
)

export interface ButtonProps
  extends VariantProps<typeof buttonVariants>,
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    useRender.ComponentProps<"button"> {}

function Button({
  className,
  variant,
  size,
  render = <button />,
  ...props
}: ButtonProps) {
  const defaultProps = {
    "data-slot": "button",
    className: cn(buttonVariants({ variant, size, className })),
  } as const

  const element = useRender({
    render,
    props: mergeProps<"button">(defaultProps, props),
  })

  return element
}

export { Button, buttonVariants }
