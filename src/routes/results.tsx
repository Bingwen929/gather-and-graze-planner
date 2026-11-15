import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { AlertTriangle, ArrowLeft, RotateCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlannerReplyView } from "@/components/planner/planner-reply";
import { Searching } from "@/components/planner/searching";
import { askPlanner, type PlannerReply } from "@/lib/planner.functions";
import { buildPlannerMessage, eventPlanSchema } from "@/lib/event-plan";

const searchSchema = z.object({
  sid: z.string().optional(),
  guests: z.coerce.number().optional(),
  preferences: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  budget: z.coerce.number().optional(),
  address: z.string().optional(),
});

type ResultsSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>): ResultsSearch => {
    const r = searchSchema.safeParse(search);
    return r.success ? r.data : {};
  },
  head: () => ({
    meta: [
      { title: "Your event food plan — Spread" },
      {
        name: "description",
        content: "Recommended pizza orders for your event, sized to your headcount and budget.",
      },
      { property: "og:title", content: "Your event food plan — Spread" },
      {
        property: "og:description",
        content: "Clear pizza order options for your event, with estimated totals and delivery times.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Results,
});

type Turn = { id: number; question: string; reply?: PlannerReply };

function Results() {
  const search = Route.useSearch();
  const ask = useServerFn(askPlanner);

  const parsed = useMemo(
    () =>
      eventPlanSchema.safeParse({
        guests: search.guests,
        preferences: search.preferences,
        date: search.date,
        time: search.time,
        budget: search.budget,
        address: search.address,
      }),
    [search],
  );

  const plan = parsed.success ? parsed.data : null;
  const sid = search.sid ?? "";
  const message = plan ? buildPlannerMessage(plan) : "";

  const first = useQuery({
    queryKey: ["planner", sid, message],
    queryFn: () => ask({ data: { sessionId: sid, message } }),
    enabled: !!plan && sid.length >= 8,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const followUp = useMutation({
    mutationFn: (q: string) => ask({ data: { sessionId: sid, message: q } }),
  });

  async function onReply(e: FormEvent) {
    e.preventDefault();
    const q = draft.trim().slice(0, 2000);
    if (!q || followUp.isPending) return;
    const id = Date.now();
    setTurns((t) => [...t, { id, question: q }]);
    setDraft("");
    const reply = await followUp
      .mutateAsync(q)
      .catch((): PlannerReply => ({ ok: false, error: "Something went wrong. Please try again." }));
    setTurns((t) => t.map((x) => (x.id === id ? { ...x, reply } : x)));
  }

  if (!plan || sid.length < 8) {
    return (
      <main className="mx-auto grid max-w-xl place-items-center gap-5 px-6 py-24 text-center">
        <h1 className="text-4xl font-medium">No event details yet</h1>
        <p className="text-muted-foreground">
          Start by telling us about your event and we'll find the food.
        </p>
        <Button asChild variant="hero" size="xl">
          <Link to="/">Plan an event</Link>
        </Button>
      </main>
    );
  }

  const when = new Date(`${plan.date}T${plan.time}`).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const firstReply: PlannerReply | undefined = first.error
    ? { ok: false, error: "Something went wrong reaching the planner. Please try again." }
    : first.data;
  const lastReply = turns.length ? turns.at(-1)?.reply : firstReply;
  const canReply = !!lastReply?.ok && !followUp.isPending;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8 lg:pt-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Edit event details
      </Link>

      <header className="mt-6 animate-rise">
        <h1 className="text-4xl font-medium sm:text-5xl">
          Pizza for <em className="italic text-primary">{plan.guests} guests</em>
        </h1>
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
          {[
            ["When", when],
            ["Preferences", plan.preferences || "Any pizza"],
            ["Budget", plan.budget ? `$${plan.budget.toLocaleString()}` : "Open"],
            ["Deliver to", plan.address],
          ].map(([k, v]) => (
            <div key={k} className="bg-card px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
              <dd className="mt-1 truncate font-medium" title={v}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-10 grid gap-8">
        {turns.length > 0 && <Accordion type="single" collapsible>
          <AccordionItem value="conversation">
            <AccordionTrigger>Earlier conversation</AccordionTrigger>
            <AccordionContent><div className="grid gap-6">
              {firstReply && <ReplyBlock reply={firstReply} />}
              {turns.slice(0, -1).map((t) => <div key={t.id} className="grid gap-3"><p className="text-sm font-medium">{t.question}</p>{t.reply && <ReplyBlock reply={t.reply} />}</div>)}
            </div></AccordionContent>
          </AccordionItem>
        </Accordion>}
        {first.isPending || followUp.isPending ? <Searching /> : lastReply && <ReplyBlock reply={lastReply} {...(turns.length ? {} : { onRetry: () => first.refetch() })} />}

        {canReply && (
          <form
            onSubmit={onReply}
            className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-card"
          >
            <label htmlFor="reply" className="font-display text-lg font-medium">
              Answer the planner or refine your plan
            </label>
            <Textarea
              id="reply"
              rows={2}
              maxLength={2000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. We prefer pepperoni and mushroom"
              className="rounded-xl bg-background text-base"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="hero" disabled={!draft.trim()}>
                Send <Send />
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function ReplyBlock({ reply, onRetry }: { reply: PlannerReply; onRetry?: () => void }) {
  if (reply.ok) return (
    <div className="grid gap-5">
      {reply.mock && (
        <div role="alert" className="flex gap-3 border border-highlight bg-highlight/20 p-5 text-highlight-foreground">
          <AlertTriangle className="size-5 shrink-0" />
          <div>
            <p className="font-semibold">Demo results — not real restaurant offers</p>
            <p className="mt-1 text-sm">Live menus were unavailable. These restaurants and prices are fictional; do not use them to order.</p>
          </div>
        </div>
      )}
      <PlannerReplyView text={reply.text} />
    </div>
  );
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl border border-destructive/40 bg-destructive/5 p-6 sm:flex-row sm:items-center">
      <AlertTriangle className="size-6 shrink-0 text-destructive" />
      <p className="flex-1 text-foreground">{reply.error}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="rounded-full">
          <RotateCcw /> Try again
        </Button>
      )}
    </div>
  );
}
