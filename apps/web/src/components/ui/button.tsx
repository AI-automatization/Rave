import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 active:scale-95",
        primary:
          "bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 active:scale-95",
        secondary:
          "bg-pink-500 text-slate-900 hover:bg-pink-400 hover:shadow-lg hover:shadow-pink-500/50 active:scale-95",
        success:
          "bg-lime-500 text-slate-900 hover:bg-lime-400 hover:shadow-lg hover:shadow-lime-500/50 active:scale-95",
        warning:
          "bg-amber-500 text-slate-900 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/50 active:scale-95",
        error:
          "bg-red-500 text-white hover:bg-red-400 hover:shadow-lg hover:shadow-red-500/50 active:scale-95",
        outline:
          "border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95",
        ghost: "text-slate-300 hover:bg-slate-700/50 hover:text-white active:scale-95",
        link: "text-cyan-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 text-sm [&_svg]:w-4 [&_svg]:h-4",
        sm: "h-7 px-3 text-xs [&_svg]:w-3 [&_svg]:h-3",
        xs: "h-6 px-2 text-xs [&_svg]:w-3 [&_svg]:h-3",
        lg: "h-11 px-6 text-base [&_svg]:w-5 [&_svg]:h-5",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0 [&_svg]:w-4 [&_svg]:h-4",
        "icon-xs": "h-6 w-6 p-0 [&_svg]:w-3 [&_svg]:h-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
