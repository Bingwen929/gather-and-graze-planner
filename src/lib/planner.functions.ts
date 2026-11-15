import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public chat trigger of the "AI Pizza Order Optimizer" n8n workflow.
const CHAT_WEBHOOK_PATH = "/webhook/c1d60280-b406-4959-8ddb-f24ab633e92a/chat";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/n8n";

const inputSchema = z.object({
  sessionId: z.string().trim().min(8).max(80),
  message: z.string().trim().min(1).max(2000),
});

export type PlannerReply = { ok: true; text: string } | { ok: false; error: string };

export const askPlanner = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<PlannerReply> => {
    const lovableKey = process.env['LOVABLE_API_KEY'];
    const n8nKey = process.env['N8N_API_KEY'];
    if (!lovableKey || !n8nKey) {
      console.error("Missing LOVABLE_API_KEY or N8N_API_KEY");
      return { ok: false, error: "The planner isn't connected right now." };
    }

    let res: Response;
    try {
      res = await fetch(`${GATEWAY_URL}${CHAT_WEBHOOK_PATH}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": n8nKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId: data.sessionId,
          chatInput: data.message,
        }),
      });
    } catch (err) {
      console.error("n8n request failed", err);
      return { ok: false, error: "We couldn't reach the planner. Please try again." };
    }

    const raw = await res.text();
    if (!res.ok) {
      console.error(`n8n webhook failed [${res.status}]: ${raw}`);
      if (res.status === 404) {
        return {
          ok: false,
          error:
            "The food-sourcing workflow is switched off in n8n. Turn it on (publish it) and try again.",
        };
      }
      return { ok: false, error: `The planner ran into a problem (${res.status}). Please try again.` };
    }

    let text = raw;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const first = Array.isArray(parsed) ? parsed[0] : parsed;
      if (first && typeof first === "object") {
        const o = first as Record<string, unknown>;
        const value = o['output'] ?? o['text'] ?? o['message'];
        if (typeof value === "string") text = value;
      }
    } catch {
      // plain text response
    }

    if (!text.trim()) return { ok: false, error: "The planner finished without any results." };
    return { ok: true, text };
  });
