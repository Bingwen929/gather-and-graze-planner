import type { ReactNode } from "react";

export function Field({
  index,
  title,
  optional,
  hint,
  error,
  htmlFor,
  children,
}: {
  index: string;
  title: string;
  optional?: boolean | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  htmlFor?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 border-t border-border py-6 first:border-t-0 first:pt-0 sm:grid-cols-[3rem_1fr]">
      <span className="font-display text-sm italic text-primary">{index}</span>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <label htmlFor={htmlFor} className="font-display text-xl font-medium text-foreground">
            {title}
          </label>
          {optional && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Optional — skip if unsure
            </span>
          )}
        </div>
        {hint && <p className="-mt-1 text-sm text-muted-foreground">{hint}</p>}
        {children}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
