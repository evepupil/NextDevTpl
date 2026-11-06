import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/components/ui-utils";

const buttonVariants = cva(
  "inline-flex min-h-9 items-center justify-center gap-2 border border-transparent px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-110",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive",
        outline: "border-border bg-background text-foreground hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-foreground hover:bg-muted",
        link: "h-auto min-h-0 border-0 bg-transparent px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10",
        xs: "h-7 min-h-7 px-2 text-xs [&_svg]:size-3",
        sm: "h-8 min-h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "size-9 min-h-9 p-0",
        "icon-xs": "size-7 min-h-7 p-0 [&_svg]:size-3",
        "icon-sm": "size-8 min-h-8 p-0",
        "icon-lg": "size-11 min-h-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
