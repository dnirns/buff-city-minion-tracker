import { describe, it, expect } from "vitest";
import { getIntentBehaviour } from "@/lib/intentBehaviour";

describe("getIntentBehaviour", () => {
  it("returns Combat behaviour", () => {
    const result = getIntentBehaviour("Combat");
    expect(result.summary).toBe("Close distance and attack");
    expect(result.actions).toHaveLength(2);
  });

  it("returns Slam behaviour", () => {
    const result = getIntentBehaviour("Slam");
    expect(result.summary).toBe("Rush into base contact and slam");
    expect(result.actions).toHaveLength(2);
  });

  it("returns BuffTokenDenial behaviour", () => {
    const result = getIntentBehaviour("BuffTokenDenial");
    expect(result.summary).toBe("Move toward and activate Buff Tokens");
    expect(result.actions).toHaveLength(2);
  });

  it("returns EvasiveManoeuvres behaviour with note", () => {
    const result = getIntentBehaviour("EvasiveManoeuvres");
    expect(result.summary).toBe("Avoid engagement and reposition");
    expect(result.actions).toHaveLength(2);
    expect(result.note).toBe("Unique Citizen only");
  });

  it("returns standard CommandingOrders for non-UC types", () => {
    const result = getIntentBehaviour("CommandingOrders", "Lieutenant");
    expect(result.summary).toBe("Command or spawn reinforcements");
    expect(result.actions[0].detail).toContain("Goon/Henchman in play");
    expect(result.actions[1].detail).toContain("one action");
  });

  it("returns standard CommandingOrders when no enemyType provided", () => {
    const result = getIntentBehaviour("CommandingOrders");
    expect(result.actions[0].detail).toContain("Goon/Henchman in play");
  });

  it("returns UC-specific CommandingOrders for UniqueCitizen", () => {
    const result = getIntentBehaviour("CommandingOrders", "UniqueCitizen");
    expect(result.summary).toBe("Command or spawn reinforcements");
    expect(result.actions[0].detail).toContain("Non-UC enemy in play");
    expect(result.actions[1].detail).toContain("two actions");
  });
});
