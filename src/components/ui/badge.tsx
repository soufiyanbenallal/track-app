import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border w-fit whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 ease-in-out overflow-hidden  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "",
        secondary:
          "bg-gradient-to-tr from-gray-50 to-gray-100 text-gray-700 border-gray-200/50",
        success:
          "bg-gradient-to-tr from-emerald-500 to-green-600 text-white border-emerald-400/20",
        destructive:
          "bg-gradient-to-tr from-red-500 to-red-600 text-white border-red-400/20",
        warning:
          "bg-gradient-to-tr from-amber-500 to-orange-600 text-white border-amber-400/20",
        info:
          "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white border-cyan-400/20",
        purple:
          "bg-gradient-to-tr from-purple-500 to-violet-600 text-white border-purple-400/20",
        outline:
          "bg-transparent text-gray-700 border-2 border-gray-300",
        ghost:
          "bg-transparent text-gray-600 border-transparent",
        premium:
          "bg-gradient-to-tr from-green-600 via-emerald-500 to-teal-400 text-white  border-green-500",
        subtle:
          "bg-gray-50/80 text-gray-600 border-gray-200/50 backdrop-blur-sm ",
      },
      size: {
        sm: "px-2 text-[10px] rounded-full py-px [&>svg]:size-3 gap-1",
        md: "px-3 py-0.5 text-[12px] [&>svg]:size-3.5 gap-1.5",
        lg: "px-4 py-1 text-sm [&>svg]:size-4 gap-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
