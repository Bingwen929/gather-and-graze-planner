import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
  {
    variants: {
      tone: {
        primary:
          "border-input bg-card text-foreground hover:border-primary/60 data-[on=true]:border-primary data-[on=true]:bg-primary data-[on=true]:text-primary-foreground",
        olive:
          "border-input bg-card text-foreground hover:border-secondary-foreground/40 data-[on=true]:border-secondary-foreground/30 data-[on=true]:bg-secondary data-[on=true]:text-secondary-foreground",
      },
    },
    defaultVariants: { tone: "primary" },
  },
);

interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  on: boolean;
}

export function Chip({ on, tone, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      data-on={on}
      aria-pressed={on}
      className={cn(chipVariants({ tone }), className)}
      {...props}
    />
  );
}
