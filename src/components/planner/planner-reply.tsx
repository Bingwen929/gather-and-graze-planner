import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock, ExternalLink, MessageCircleQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { splitPlannerReply } from "@/lib/event-plan";

function Md({ children }: { children: string }) {
  return (
    <div className="planner-md text-[0.95rem] text-foreground/85">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const bare = typeof children === "string" && children === href;
            return (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {bare ? "Open restaurant page ↗" : children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function PlannerReplyView({ text }: { text: string }) {
  const { intro, sections } = splitPlannerReply(text);

  // A reply without titled sections is the planner asking for more details.
  const header = sections[0];
  if (!header) {
    return (
      <div className="flex gap-4 rounded-3xl border border-highlight/60 bg-highlight/20 p-6">
        <MessageCircleQuestion className="mt-0.5 size-6 shrink-0 text-highlight-foreground" />
        <div className="grid gap-1">
          <p className="font-display text-lg font-medium text-foreground">
            The planner needs a little more
          </p>
          <Md>{intro}</Md>
        </div>
      </div>
    );
  }

  const options = sections.filter((s) => /^Option [A-Z]/.test(s.title));
  const details = sections.filter((s) => s.title === "How I decided" || s.title === "Notes");
  const budgetWarning =
    sections.find((s) => /^Heads up:/i.test(s.title))?.title ??
    text.split(/\r?\n/).find((line) => /No option fits/i.test(line));

  return (
    <div className="grid gap-6">
      {intro && (
        <div className="rounded-2xl bg-highlight/30 px-5 py-3 text-sm font-medium">
          <Md>{intro.replace(/\*\*/g, "")}</Md>
        </div>
      )}

      {options.length ? (
        <div>
          <h2 className="text-2xl font-medium">Your restaurant options</h2>
          <p className="mt-1 text-sm text-muted-foreground">Estimated totals include food and reported fees; tax and tip are excluded. Confirm prices before ordering.</p>
          {budgetWarning && <p className="mt-3 border-l-2 border-primary pl-3 text-sm font-medium">{budgetWarning.replace(/^\s*-\s*/, "")}</p>}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-medium">{header.title}</h2>
          {header.body && <Md>{header.body}</Md>}
        </div>
      )}

      {options.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {options.map((o, i) => {
            const fields = new Map(o.body.split(/\r?\n/).flatMap((line) => {
              const match = line.match(/^\s*-\s*([^:]+):\s*(.*)$/);
              return match?.[1] && match[2] ? [[match[1], match[2]] as const] : [];
            }));
            const total = fields.get("Estimated total") ?? "";
            const price = total.match(/\$[\d,.]+/)?.[0];
            const restaurant = fields.get("Restaurant");
            const order = fields.get("Order")?.replace(/\s+at\s+\$[\d,.]+/g, "");
            const link = fields.get("Link");
            const safeLink = link && /^https:\/\//i.test(link) ? link.replace(/\|/g, "%7C") : null;
            return (
              <article
                key={o.title}
                className="flex min-w-0 flex-col gap-5 rounded-lg border border-border bg-card p-6 shadow-card"
              >
                <header>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Option {i + 1}
                  </p>
                  <h3 className="mt-2 break-words text-xl font-medium">{restaurant || `Option ${i + 1}`}</h3>
                  {fields.get("Platform") && <p className="mt-1 text-sm text-muted-foreground">{fields.get("Platform")}</p>}
                </header>
                {price && <div>
                  <p className="font-display text-4xl font-medium">{price}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{fields.get("Cost per person")} per person</p>
                  {/over budget/i.test(total) && <p className="mt-2 text-sm font-semibold text-primary">Over budget</p>}
                </div>}
                {order && <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Your order</p>
                  <ul className="grid gap-2 text-sm leading-relaxed">{order.split("; ").map((item) => <li key={item}>{item}</li>)}</ul>
                </div>}
                {fields.get("Estimated delivery") && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4 shrink-0" />{fields.get("Estimated delivery")?.replace(" (advertised)", "")}</p>}
                <div className="mt-auto grid gap-2">
                  {safeLink && <Button asChild variant="outline" className="w-full"><a href={safeLink} target="_blank" rel="noopener noreferrer">View restaurant <ExternalLink /></a></Button>}
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`details-${i}`} className="border-0">
                      <AccordionTrigger>Price breakdown & details</AccordionTrigger>
                      <AccordionContent><Md>{o.body.split(/\r?\n/).filter((line) => !/^\s*-\s*Why:/i.test(line)).join("\n")}</Md></AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {details.length > 0 && <Accordion type="single" collapsible>
        <AccordionItem value="method">
          <AccordionTrigger>How these options were chosen & important notes</AccordionTrigger>
          <AccordionContent><div className="grid gap-5">{details.map((s) => <section key={s.title}><h3 className="mb-2 text-lg font-medium">{s.title}</h3><Md>{s.body.split(/\r?\n/).filter((line) => !/Cheapest\s*=|Best Value\s*=/i.test(line)).join("\n")}</Md></section>)}</div></AccordionContent>
        </AccordionItem>
      </Accordion>}
    </div>
  );
}
