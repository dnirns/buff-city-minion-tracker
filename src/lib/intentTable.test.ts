import { describe, it, expect } from "vitest";
import { lookupIntent } from "@/lib/intentTable";

describe("lookupIntent", () => {
  describe("Goon", () => {
    it("returns Combat for rolls 1-6", () => {
      expect(lookupIntent("Goon", 1)).toBe("Combat");
      expect(lookupIntent("Goon", 6)).toBe("Combat");
    });

    it("returns Slam for rolls 7-9", () => {
      expect(lookupIntent("Goon", 7)).toBe("Slam");
      expect(lookupIntent("Goon", 9)).toBe("Slam");
    });

    it("returns BuffTokenDenial for rolls 10-12", () => {
      expect(lookupIntent("Goon", 10)).toBe("BuffTokenDenial");
      expect(lookupIntent("Goon", 12)).toBe("BuffTokenDenial");
    });
  });

  describe("Henchman", () => {
    it("returns Combat for rolls 1-8", () => {
      expect(lookupIntent("Henchman", 1)).toBe("Combat");
      expect(lookupIntent("Henchman", 8)).toBe("Combat");
    });

    it("returns Slam for rolls 9-12", () => {
      expect(lookupIntent("Henchman", 9)).toBe("Slam");
      expect(lookupIntent("Henchman", 12)).toBe("Slam");
    });
  });

  describe("Lieutenant", () => {
    it("returns Combat for rolls 1-6", () => {
      expect(lookupIntent("Lieutenant", 1)).toBe("Combat");
      expect(lookupIntent("Lieutenant", 6)).toBe("Combat");
    });

    it("returns Slam for rolls 7-8", () => {
      expect(lookupIntent("Lieutenant", 7)).toBe("Slam");
      expect(lookupIntent("Lieutenant", 8)).toBe("Slam");
    });

    it("returns CommandingOrders for rolls 9-12", () => {
      expect(lookupIntent("Lieutenant", 9)).toBe("CommandingOrders");
      expect(lookupIntent("Lieutenant", 12)).toBe("CommandingOrders");
    });
  });

  describe("UniqueCitizen", () => {
    it("returns Combat for rolls 1-3", () => {
      expect(lookupIntent("UniqueCitizen", 1)).toBe("Combat");
      expect(lookupIntent("UniqueCitizen", 3)).toBe("Combat");
    });

    it("returns Slam for rolls 4-6", () => {
      expect(lookupIntent("UniqueCitizen", 4)).toBe("Slam");
      expect(lookupIntent("UniqueCitizen", 6)).toBe("Slam");
    });

    it("returns EvasiveManoeuvres for rolls 7-8", () => {
      expect(lookupIntent("UniqueCitizen", 7)).toBe("EvasiveManoeuvres");
      expect(lookupIntent("UniqueCitizen", 8)).toBe("EvasiveManoeuvres");
    });

    it("returns CommandingOrders for rolls 9-12", () => {
      expect(lookupIntent("UniqueCitizen", 9)).toBe("CommandingOrders");
      expect(lookupIntent("UniqueCitizen", 12)).toBe("CommandingOrders");
    });
  });

  it("falls back to last intent for out-of-range roll", () => {
    expect(lookupIntent("Goon", 13)).toBe("BuffTokenDenial");
  });
});
