import { describe, it, expect, vi } from "vitest";
import { rollD4, rollD6, rollD12 } from "@/lib/dice";

describe("rollD4", () => {
  it("returns 1 when random returns 0", () => {
    expect(rollD4(() => 0)).toBe(1);
  });

  it("returns 4 when random returns just under 1", () => {
    expect(rollD4(() => 0.999)).toBe(4);
  });

  it("returns deterministic values with fixed RNG", () => {
    expect(rollD4(() => 0.25)).toBe(2);
    expect(rollD4(() => 0.5)).toBe(3);
    expect(rollD4(() => 0.75)).toBe(4);
  });

  it("only produces values 1-4 across many rolls", () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD4();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(4);
    }
  });

  it("uses Math.random by default", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = rollD4();
    expect(spy).toHaveBeenCalled();
    expect(result).toBe(3);
    spy.mockRestore();
  });
});

describe("rollD6", () => {
  it("returns 1 when random returns 0", () => {
    expect(rollD6(() => 0)).toBe(1);
  });

  it("returns 6 when random returns just under 1", () => {
    expect(rollD6(() => 0.999)).toBe(6);
  });

  it("returns deterministic values with fixed RNG", () => {
    expect(rollD6(() => 0.0)).toBe(1);
    expect(rollD6(() => 0.17)).toBe(2);
    expect(rollD6(() => 0.34)).toBe(3);
    expect(rollD6(() => 0.5)).toBe(4);
    expect(rollD6(() => 0.67)).toBe(5);
    expect(rollD6(() => 0.84)).toBe(6);
  });

  it("only produces values 1-6 across many rolls", () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD6();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it("uses Math.random by default", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = rollD6();
    expect(spy).toHaveBeenCalled();
    expect(result).toBe(4);
    spy.mockRestore();
  });
});

describe("rollD12", () => {
  it("returns 1 when random returns 0", () => {
    expect(rollD12(() => 0)).toBe(1);
  });

  it("returns 12 when random returns just under 1", () => {
    expect(rollD12(() => 0.999)).toBe(12);
  });

  it("returns deterministic values with fixed RNG", () => {
    expect(rollD12(() => 0.0)).toBe(1);
    expect(rollD12(() => 0.5)).toBe(7);
    expect(rollD12(() => 0.75)).toBe(10);
  });

  it("only produces values 1-12 across many rolls", () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD12();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(12);
    }
  });

  it("uses Math.random by default", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = rollD12();
    expect(spy).toHaveBeenCalled();
    expect(result).toBe(7);
    spy.mockRestore();
  });
});