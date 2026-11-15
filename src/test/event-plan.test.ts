import { describe, expect, it } from "vitest";

import { buildPlannerMessage, eventPlanSchema } from "@/lib/event-plan";

const future = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
})();

const base = {
  guests: 20,
  dietaryCount: 3,
  diets: [],
  date: future,
  time: "18:00",
  address: "500 El Camino Real, Santa Clara, CA 95053",
};

describe("event plan rules", () => {
  it("accepts a plan with cuisine and budget skipped", () => {
    expect(eventPlanSchema.safeParse(base).success).toBe(true);
  });

  it("rejects more dietary-restricted guests than total guests", () => {
    const r = eventPlanSchema.safeParse({ ...base, dietaryCount: 21 });
    expect(r.success).toBe(false);
  });

  it("requires the event date and time", () => {
    expect(eventPlanSchema.safeParse({ ...base, date: "" }).success).toBe(false);
    expect(eventPlanSchema.safeParse({ ...base, time: "" }).success).toBe(false);
  });

  it("tells the planner when cuisine and budget are unknown", () => {
    const msg = buildPlannerMessage(eventPlanSchema.parse(base));
    expect(msg).toContain("20 people");
    expect(msg).toContain("3 of the guests have dietary restrictions");
    expect(msg).toContain("not sure which food");
    expect(msg).toContain("not sure about the budget");
  });

  it("includes cuisine and budget when given", () => {
    const msg = buildPlannerMessage(
      eventPlanSchema.parse({ ...base, cuisine: "tacos", budget: 300 }),
    );
    expect(msg).toContain("Preferred food: tacos & burritos.");
    expect(msg).toContain("Total budget: $300.");
  });
});
