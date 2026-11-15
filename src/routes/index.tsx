import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, MapPin, Search, Sparkles, Utensils } from "lucide-react";

import heroTable from "@/assets/hero-table.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/planner/field";
import { NumberStepper } from "@/components/planner/number-stepper";
import { eventPlanSchema } from "@/lib/event-plan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spread — Food sourcing for your next event" },
      {
        name: "description",
        content:
          "Tell us your headcount, pizza preferences, date and budget. Spread compares DoorDash and Uber Eats to find pizza for your event.",
      },
      { property: "og:title", content: "Spread — Food sourcing for your next event" },
      {
        property: "og:description",
        content:
          "Headcount, pizza preferences, date and budget in — clear group pizza orders out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type FieldKey = "guests" | "preferences" | "date" | "time" | "budget" | "address";
type Errors = Partial<Record<FieldKey, string>>;

function Index() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState("25");
  const [preferences, setPreferences] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [budget, setBudget] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const perPerson =
    Number(budget) > 0 && Number(guests) > 0 ? Number(budget) / Number(guests) : null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = eventPlanSchema.safeParse({
      guests,
      preferences,
      date,
      time,
      budget,
      address,
    });
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]) as FieldKey;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const p = result.data;
    navigate({
      to: "/results",
      search: {
        sid: crypto.randomUUID(),
        guests: p.guests,
        preferences: p.preferences ?? "",
        date: p.date,
        time: p.time,
        budget: p.budget,
        address: p.address,
      },
    });
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-6 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pt-10">
      {/* Left: story */}
      <section className="animate-rise lg:sticky lg:top-8 lg:self-start">
        <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
          <Utensils className="size-3.5" /> Event pizza sourcing
        </p>
        <h1 className="mt-5 text-5xl font-medium leading-[1.02] text-foreground sm:text-6xl">
          Feed the whole room,{" "}
          <em className="font-normal italic text-primary">without the spreadsheet.</em>
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted-foreground">
          Tell us who's coming and when. We compare nearby pizzerias on DoorDash and Uber Eats
          and bring back clear order options for your crowd.
        </p>

        <figure className="relative mt-8 overflow-hidden rounded-3xl shadow-card">
          <img
            src={heroTable}
            alt="A long table set for a group meal"
            width={1600}
            height={1104}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-fade" />
          <figcaption className="absolute inset-x-5 bottom-5 flex flex-wrap gap-2">
            {["Sized to your headcount", "Menus compared", "Estimated order prices"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur"
              >
                {t}
              </span>
            ))}
          </figcaption>
        </figure>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: CalendarDays, t: "Share the details", d: "Headcount, date, a few preferences." },
            { icon: Search, t: "We search", d: "Menus compared across delivery apps." },
            { icon: Sparkles, t: "Pick an order", d: "Three clear restaurant options." },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="grid gap-1.5">
              <Icon className="size-5 text-primary" />
              <span className="font-display text-base font-medium">{t}</span>
              <span className="text-sm text-muted-foreground">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Right: form */}
      <section
        className="animate-rise rounded-[2rem] border border-border bg-card p-6 shadow-card [animation-delay:120ms] sm:p-10"
        aria-labelledby="plan-title"
      >
        <h2 id="plan-title" className="text-3xl font-medium">
          Tell us about your event
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Takes about a minute. Add your total budget and any pizza preferences so we can start searching.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-8">
          <Field
            index="01"
            title="How many people are coming?"
            htmlFor="guests"
            error={errors.guests}
          >
            <NumberStepper
              id="guests"
              value={guests}
              onChange={setGuests}
              min={1}
              unit="guests"
              invalid={!!errors.guests}
            />
          </Field>

          <Field
            index="02"
            title="What pizza would you like?"
            htmlFor="preferences"
            hint="Optional — add toppings or styles, such as pepperoni, mushroom or margherita."
            error={errors.preferences}
          >
            <Input
              id="preferences"
              placeholder="e.g. Pepperoni and mushroom"
              maxLength={200}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              aria-invalid={!!errors.preferences}
              className="h-12 rounded-xl bg-card text-base aria-[invalid=true]:border-destructive"
            />
          </Field>

          <Field
            index="03"
            title="When is the event?"
            htmlFor="date"
            error={errors.date ?? errors.time}
          >
            <div className="grid grid-cols-[1.4fr_1fr] gap-3">
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={!!errors.date}
                className="h-12 rounded-xl bg-card text-base aria-[invalid=true]:border-destructive"
              />
              <Input
                id="time"
                type="time"
                aria-label="Start time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-invalid={!!errors.time}
                className="h-12 rounded-xl bg-card text-base aria-[invalid=true]:border-destructive"
              />
            </div>
          </Field>

          <Field
            index="04"
            title="Ideal total budget"
            htmlFor="budget"
            error={errors.budget}
          >
            <div className="flex max-w-xs items-center rounded-xl border border-input bg-card px-4 focus-within:ring-1 focus-within:ring-ring">
              <span className="font-display text-xl text-muted-foreground">$</span>
              <input
                id="budget"
                inputMode="decimal"
                placeholder="e.g. 400"
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ""))}
                aria-invalid={!!errors.budget}
                className="h-12 w-full bg-transparent px-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {perPerson !== null && (
              <p className="text-sm text-muted-foreground">
                About <span className="font-semibold text-foreground">${perPerson.toFixed(2)}</span>{" "}
                per person
              </p>
            )}
          </Field>

          <Field
            index="05"
            title="Where should the food go?"
            htmlFor="address"
            hint="A street address or ZIP code, so we can find restaurants that deliver."
            error={errors.address}
          >
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="address"
                placeholder="500 El Camino Real, Santa Clara, CA 95053"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-invalid={!!errors.address}
                className="h-12 rounded-xl bg-card pl-10 text-base aria-[invalid=true]:border-destructive"
              />
            </div>
          </Field>

          <div className="mt-4 flex flex-col items-start gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              We never place orders or take payment.
            </p>
            <Button type="submit" variant="hero" size="xl" className="w-full sm:w-auto">
              Find pizza for my event <ArrowRight />
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
