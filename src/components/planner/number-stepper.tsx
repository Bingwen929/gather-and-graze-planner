import { Minus, Plus } from "lucide-react";

export function NumberStepper({
  id,
  value,
  onChange,
  min = 0,
  unit,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  unit: string;
  invalid?: boolean;
}) {
  const n = Number(value) || 0;
  const step = (d: number) => onChange(String(Math.max(min, n + d)));
  return (
    <div
      data-invalid={invalid}
      className="flex w-full max-w-xs items-center rounded-full border border-input bg-card p-1.5 data-[invalid=true]:border-destructive"
    >
      <button
        type="button"
        aria-label={`Fewer ${unit}`}
        onClick={() => step(-1)}
        className="grid size-10 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent"
      >
        <Minus className="size-4" />
      </button>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        className="w-full min-w-0 bg-transparent text-center font-display text-2xl font-medium text-foreground outline-none"
      />
      <span className="pr-2 text-sm text-muted-foreground">{unit}</span>
      <button
        type="button"
        aria-label={`More ${unit}`}
        onClick={() => step(1)}
        className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
