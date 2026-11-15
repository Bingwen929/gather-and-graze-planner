import { describe, expect, it } from "vitest";

import { buildPlannerMessage, eventPlanSchema } from "@/lib/event-plan";

const future = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
})();

const base = {
  guests: 20,
  date: future,
  time: "18:00",
  address: "500 El Camino Real, Santa Clara, CA 95053",
};

const complete = { ...base, preferences: "pepperoni and mushroom", budget: 300 };

describe("event plan rules", () => {
  it("allows pizza preferences to be left open", () => {
    const result = eventPlanSchema.safeParse({ ...base, budget: 300 });
    expect(result.success).toBe(true);
    const message = buildPlannerMessage(eventPlanSchema.parse({ ...base, budget: 300 }));
    expect(message).toContain("planning pizza");
    expect(message).not.toMatch(/preferences:/i);
  });

  it("requires a total budget", () => {
    const result = eventPlanSchema.safeParse(base);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "budget")).toBe(true);
  });

  it("ignores legacy cuisine and dietary fields and excludes them from the planner request", () => {
    const plan = eventPlanSchema.parse({
      ...complete,
      cuisine: "tacos",
      dietaryCount: 3,
      diets: ["Vegetarian"],
    });
    expect(plan).not.toHaveProperty("cuisine");
    expect(plan).not.toHaveProperty("dietaryCount");
    expect(plan).not.toHaveProperty("diets");
    const message = buildPlannerMessage(plan);
    expect(message).not.toMatch(/tacos|dietary|vegetarian/i);
  });

  it("requires the event date and time", () => {
    expect(eventPlanSchema.safeParse({ ...complete, date: "" }).success).toBe(false);
    expect(eventPlanSchema.safeParse({ ...complete, time: "" }).success).toBe(false);
  });

  it("accepts a complete plan", () => {
    expect(eventPlanSchema.safeParse(complete).success).toBe(true);
  });

  it("includes pizza preferences and the required budget in the planner request", () => {
    const msg = buildPlannerMessage(eventPlanSchema.parse(complete));
    expect(msg).toContain("20 people");
    expect(msg).toContain("Pizza preferences: pepperoni and mushroom.");
    expect(msg).toContain("Total budget: $300.");
  });
});
