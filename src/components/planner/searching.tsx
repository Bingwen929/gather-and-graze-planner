import { useEffect, useState } from "react";
import { Pizza, Salad, Sandwich, Soup } from "lucide-react";

const STEPS = [
  "Reading your event details…",
  "Searching restaurants near you on DoorDash…",
  "Checking Uber Eats menus…",
  "Sizing portions for your headcount…",
  "Filtering for dietary needs…",
  "Comparing totals against your budget…",
  "Plating up your best options…",
];

export function Searching() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, STEPS.length - 1)), 4000);
    return () => clearInterval(t);
  }, []);
  const icons = [Pizza, Soup, Sandwich, Salad];
  return (
    <div className="grid place-items-center gap-6 rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-card">
      <div className="flex gap-3">
        {icons.map((Icon, k) => (
          <span
            key={k}
            className="grid size-12 animate-simmer place-items-center rounded-full bg-accent text-primary"
            style={{ animationDelay: `${k * 180}ms` }}
          >
            <Icon className="size-5" />
          </span>
        ))}
      </div>
      <div className="grid gap-2">
        <p className="font-display text-2xl font-medium" aria-live="polite">
          {STEPS[i]}
        </p>
        <p className="text-sm text-muted-foreground">
          This usually takes under a minute. Keep this page open.
        </p>
      </div>
    </div>
  );
}
