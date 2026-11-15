import { z } from "zod";

// Food types the n8n "AI Pizza Order Optimizer" workflow can search for.
export const CUISINES = [
  { value: "pizza", label: "Pizza" },
  { value: "burgers", label: "Burgers" },
  { value: "tacos", label: "Tacos & burritos" },
  { value: "sushi", label: "Sushi" },
  { value: "sandwiches", label: "Sandwiches & subs" },
] as const;

export type Cuisine = (typeof CUISINES)[number]["value"];

/** Guidance from n8n's Validate Request step; optional budgets stay optional. */
export function minimumPlannerBudget(cuisine: Cuisine | undefined, guests: number): number | null {
  if (!cuisine || !Number.isFinite(guests) || guests < 1) return null;
  const foodPerPerson: Record<Cuisine, number> = {
    pizza: 4, burgers: 6, tacos: 5, sushi: 8, sandwiches: 6,
  };
  return Math.ceil((foodPerPerson[cuisine] * guests * 1.35 + 4) / 5) * 5;
}

const todayISO = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const eventPlanSchema = z
  .object({
    guests: z.coerce
      .number({ message: "Enter how many people you expect" })
      .int("Use a whole number")
      .min(1, "At least 1 person")
      .max(2000, "That's a lot — 2,000 people max"),
    cuisine: z.enum(["pizza", "burgers", "tacos", "sushi", "sandwiches"]).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the event date"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
    budget: z.coerce
      .number()
      .positive("Budget must be more than $0")
      .max(1_000_000, "Budget looks too high")
      .optional(),
    address: z
      .string()
      .trim()
      .min(3, "Add a delivery address or ZIP code")
      .max(200, "Keep the address under 200 characters"),
  })
  .superRefine((v, ctx) => {
    if (v.date < todayISO()) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "Pick today or a future date" });
    }
  });

export type EventPlan = z.infer<typeof eventPlanSchema>;

function formatWhen(date: string, time: string) {
  const dt = new Date(`${date}T${time}`);
  return dt.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Turn the form into the plain-language request the n8n chat workflow understands. */
export function buildPlannerMessage(plan: EventPlan): string {
  const cuisine = CUISINES.find((c) => c.value === plan.cuisine);
  const parts: string[] = [
    `I'm planning food for an event with ${plan.guests} people.`,
    `Delivery address: ${plan.address}.`,
    `The event is on ${formatWhen(plan.date, plan.time)}; the food should arrive by then.`,
  ];

  parts.push(
    cuisine
      ? `Preferred food: ${cuisine.label.toLowerCase()}.`
      : "I'm not sure which food to choose yet.",
  );

  parts.push(
    plan.budget
      ? `Total budget: $${plan.budget}.`
      : "I'm not sure about the budget yet.",
  );

  return parts.join(" ");
}

/** Split the workflow's markdown reply into an intro and bold-titled sections. */
export function splitPlannerReply(text: string) {
  const lines = text.replace(/^\s*\*\*DEMO MODE:[^\n]*\*\*\s*/i, "").split(/\r?\n/);
  const intro: string[] = [];
  const sections: { title: string; body: string[] }[] = [];
  for (const line of lines) {
    const heading = line.trim().match(/^\*\*(.+?)\*\*$/);
    if (heading?.[1]) {
      sections.push({ title: heading[1], body: [] });
      continue;
    }
    const current = sections.at(-1);
    if (current) current.body.push(line);
    else intro.push(line);
  }
  return {
    intro: intro.join("\n").trim(),
    sections: sections.map((s) => ({ title: s.title, body: s.body.join("\n").trim() })),
  };
}
