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

const complete = { ...base, cuisine: "tacos", budget: 300 };

describe("event plan rules", () => {
  it("requires a food type", () => {
    const result = eventPlanSchema.safeParse({ ...base, budget: 300 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "cuisine")).toBe(true);
  });

  it("requires a total budget", () => {
    const result = eventPlanSchema.safeParse({ ...base, cuisine: "tacos" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "budget")).toBe(true);
  });

  it("ignores legacy dietary fields and excludes them from the planner request", () => {
    const plan = eventPlanSchema.parse({ ...complete, dietaryCount: 3, diets: ["Vegetarian"] });
    expect(plan).not.toHaveProperty("dietaryCount");
    expect(plan).not.toHaveProperty("diets");
    const message = buildPlannerMessage(plan);
    expect(message).not.toMatch(/dietary|vegetarian/i);
  });

  it("requires the event date and time", () => {
    expect(eventPlanSchema.safeParse({ ...complete, date: "" }).success).toBe(false);
    expect(eventPlanSchema.safeParse({ ...complete, time: "" }).success).toBe(false);
  });

  it("accepts a complete plan", () => {
    expect(eventPlanSchema.safeParse(complete).success).toBe(true);
  });

  it("includes the required food type and budget in the planner request", () => {
    const msg = buildPlannerMessage(eventPlanSchema.parse(complete));
    expect(msg).toContain("20 people");
    expect(msg).toContain("Preferred food: tacos & burritos.");
    expect(msg).toContain("Total budget: $300.");
  });
});
