import { describe, expect, it } from "vitest";
import { parsePlannerResponse } from "@/lib/planner-response";
import { splitPlannerReply } from "@/lib/event-plan";

describe("updated n8n contract", () => {
  it("preserves follow-up metadata", () => {
    expect(parsePlannerResponse(JSON.stringify({ output: "Which cuisine?", needs_more_info: true })))
      .toEqual({ ok: true, text: "Which cuisine?", needsMoreInfo: true, mock: false });
  });
  it("identifies fictional recommendations", () => {
    expect(parsePlannerResponse(JSON.stringify({ output: "Example plan", mock: true })))
      .toEqual({ ok: true, text: "Example plan", mock: true, needsMoreInfo: false });
  });
  it("supports array responses", () => {
    expect(parsePlannerResponse('[{"output":"Real plan","mock":false}]'))
      .toEqual({ ok: true, text: "Real plan", mock: false, needsMoreInfo: false });
  });
  it("rejects an unexpected payload instead of displaying JSON as a plan", () => {
    expect(parsePlannerResponse('{"unexpected":true}').ok).toBe(false);
  });
  it("does not mistake the demo warning for the plan title", () => {
    const result = splitPlannerReply("**DEMO MODE: fictional MOCK data.**\n\n**Tacos for 25 people, budget $200.00**\nDelivery to: 95053\n\n**Option A: Cheapest**\nExample");
    expect(result.sections[0]?.title).toBe("Tacos for 25 people, budget $200.00");
    expect(result.sections[1]?.title).toBe("Option A: Cheapest");
  });
  it("detects fictional data even when a budget warning comes first", () => {
    const result = parsePlannerResponse(JSON.stringify({
      output: "**Heads up: the budget is too low.**\n\n**DEMO MODE: fictional MOCK data.**\n\n**Pizza for 25 people**",
    }));
    expect(result).toMatchObject({ ok: true, mock: true });
  });
});