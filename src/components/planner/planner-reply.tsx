import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircleQuestion } from "lucide-react";

import { splitPlannerReply } from "@/lib/event-plan";
import { cn } from "@/lib/utils";

function Md({ children }: { children: string }) {
  return (
    <div className="planner-md text-[0.95rem] text-foreground/85">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
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

  const rest = sections.slice(1);
  const options = rest.filter((s) => /^Option [A-Z]/.test(s.title));
  const others = rest.filter((s) => !/^Option [A-Z]/.test(s.title));
  const before = others.filter((s) => s.title !== "Notes");
  const notes = others.filter((s) => s.title === "Notes");

  return (
    <div className="grid gap-6">
      {intro && (
        <div className="rounded-2xl bg-highlight/30 px-5 py-3 text-sm font-medium">
          <Md>{intro.replace(/\*\*/g, "")}</Md>
        </div>
      )}

      <div className="rounded-3xl bg-ink p-7 text-ink-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-highlight">
          Your plan
        </p>
        <h2 className="mt-2 text-3xl font-medium">{header.title}</h2>
        {header.body && (
          <p className="mt-3 text-sm text-ink-foreground/75">{header.body.replace(/\*\*/g, "")}</p>
        )}
      </div>

      {options.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {options.map((o, i) => {
            const [, letter, label] = o.title.match(/^Option ([A-Z]):\s*(.*)$/) ?? [];
            const featured = /best value/i.test(label ?? "");
            return (
              <article
                key={o.title}
                style={{ animationDelay: `${i * 90}ms` }}
                className={cn(
                  "animate-rise flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-card",
                  featured ? "border-primary ring-1 ring-primary" : "border-border",
                )}
              >
                <header className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full font-display text-lg",
                      featured ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    {letter}
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Option {letter}
                    </p>
                    <h3 className="text-xl font-medium">{label || o.title}</h3>
                  </div>
                </header>
                <Md>{o.body}</Md>
              </article>
            );
          })}
        </div>
      )}

      {before.map((s) => (
        <section key={s.title} className="rounded-3xl border border-border bg-card p-6">
          <h3 className="text-xl font-medium">{s.title}</h3>
          <div className="mt-3">
            <Md>{s.body}</Md>
          </div>
        </section>
      ))}

      {notes.map((s) => (
        <section key={s.title} className="rounded-3xl bg-muted p-6">
          <h3 className="text-lg font-medium">{s.title}</h3>
          <div className="mt-2 text-sm">
            <Md>{s.body}</Md>
          </div>
        </section>
      ))}
    </div>
  );
}
