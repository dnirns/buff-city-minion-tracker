import { describe, it, expect } from "vitest";
import { lookupSpawnType } from "@/lib/spawnTable";
import type { TurnNumber } from "@/lib/types";

const EXPECTED_THRESHOLDS: Record<number, { goonMax: number; henchmanMax: number }> = {
  1: { goonMax: 8, henchmanMax: 11 },
  2: { goonMax: 7, henchmanMax: 10 },
  3: { goonMax: 6, henchmanMax: 10 },
  4: { goonMax: 5, henchmanMax: 9 },
  5: { goonMax: 4, henchmanMax: 6 },
  6: { goonMax: 5, henchmanMax: 9 },
  7: { goonMax: 6, henchmanMax: 10 },
  8: { goonMax: 7, henchmanMax: 10 },
  9: { goonMax: 8, henchmanMax: 11 },
};

describe("lookupSpawnType", () => {
  for (let turn = 1; turn <= 9; turn++) {
    const t = turn as TurnNumber;
    const { goonMax, henchmanMax } = EXPECTED_THRESHOLDS[turn];

    describe(`turn ${turn}`, () => {
      it("returns Goon for rolls at and below goonMax", () => {
        expect(lookupSpawnType(t, 1)).toBe("Goon");
        expect(lookupSpawnType(t, goonMax)).toBe("Goon");
      });

      it("returns Henchman for rolls above goonMax up to henchmanMax", () => {
        expect(lookupSpawnType(t, goonMax + 1)).toBe("Henchman");
        expect(lookupSpawnType(t, henchmanMax)).toBe("Henchman");
      });

      it("returns Lieutenant for rolls above henchmanMax", () => {
        expect(lookupSpawnType(t, henchmanMax + 1)).toBe("Lieutenant");
        expect(lookupSpawnType(t, 12)).toBe("Lieutenant");
      });
    });
  }

  describe("turn 10", () => {
    it("returns null for any roll", () => {
      expect(lookupSpawnType(10, 1)).toBeNull();
      expect(lookupSpawnType(10, 6)).toBeNull();
      expect(lookupSpawnType(10, 12)).toBeNull();
    });
  });
});
