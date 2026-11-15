export type PlannerReply =
  | { ok: true; text: string; mock: boolean; needsMoreInfo: boolean }
  | { ok: false; error: string };

/** The API webhook returns metadata alongside the same conversational markdown. */
export function parsePlannerResponse(raw: string): PlannerReply {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return raw.trim()
      ? { ok: true, text: raw, mock: /\*\*DEMO MODE:/i.test(raw), needsMoreInfo: false }
      : { ok: false, error: "The planner finished without any results." };
  }
  const first: unknown = Array.isArray(value) ? value[0] : value;
  if (typeof first === "string" && first.trim()) {
    return { ok: true, text: first, mock: /\*\*DEMO MODE:/i.test(first), needsMoreInfo: false };
  }
  if (first && typeof first === "object") {
    const record = first as Record<string, unknown>;
    const text = record['output'] ?? record['text'] ?? record['message'];
    if (typeof text === "string" && text.trim()) {
      return {
        ok: true,
        text,
        mock: record['mock'] === true || /\*\*DEMO MODE:/i.test(text),
        needsMoreInfo: record['needs_more_info'] === true,
      };
    }
  }
  return { ok: false, error: "The planner returned an unreadable result. Please try again." };
}