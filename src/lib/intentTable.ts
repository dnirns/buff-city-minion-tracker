import type { EnemyType, Intent } from "./types";

interface IntentRange {
  intent: Intent;
  maxRoll: number;
}

const INTENT_TABLE: Record<EnemyType, IntentRange[]> = {
  Minion: [
    { intent: "Combat",          maxRoll: 6  },
    { intent: "Slam",            maxRoll: 9  },
    { intent: "BuffTokenDenial", maxRoll: 12 },
  ],
  Muscle: [
    { intent: "Combat", maxRoll: 8  },
    { intent: "Slam",   maxRoll: 12 },
  ],
  Lieutenant: [
    { intent: "Combat",           maxRoll: 6  },
    { intent: "Slam",             maxRoll: 8  },
    { intent: "CommandingOrders", maxRoll: 12 },
  ],
  UniqueCitizen: [
    { intent: "Combat",            maxRoll: 3  },
    { intent: "Slam",              maxRoll: 6  },
    { intent: "EvasiveManoeuvres", maxRoll: 8  },
    { intent: "CommandingOrders",  maxRoll: 12 },
  ],
};

export function lookupIntent(
  enemyType: EnemyType,
  d12Roll: number
): Intent {
  const ranges = INTENT_TABLE[enemyType];
  for (const range of ranges) {
    if (d12Roll <= range.maxRoll) return range.intent;
  }
  return ranges[ranges.length - 1].intent;
}
