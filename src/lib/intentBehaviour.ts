import type { EnemyType, Intent } from "./types";

export interface ActionStep {
  label: string;
  detail: string;
}

export interface IntentBehaviour {
  summary: string;
  actions: ActionStep[];
  note?: string;
}

const INTENT_BEHAVIOURS: Record<Intent, IntentBehaviour> = {
  Combat: {
    summary: "Close distance and attack",
    actions: [
      {
        label: "1st",
        detail: "In range? Attack. Otherwise move/climb toward closest player.",
      },
      {
        label: "2nd",
        detail: "In range? Attack. Otherwise D6: 1-3 Ready, 4-6 Move toward player (cover).",
      },
    ],
  },
  Slam: {
    summary: "Rush into base contact and slam",
    actions: [
      {
        label: "1st",
        detail: "Move/climb toward closest player.",
      },
      {
        label: "2nd",
        detail: "Base-to-base? Slam. Otherwise D6: 1-2 Ready, 3-6 Move (free Slam if contact).",
      },
    ],
  },
  BuffTokenDenial: {
    summary: "Move toward and activate Buff Tokens",
    actions: [
      {
        label: "1st",
        detail: "Move toward closest Buff Token (cover). Within 1\"? Activate it, spawn, re-roll intent.",
      },
      {
        label: "2nd",
        detail: "Move toward closest Buff Token (cover). Within 1\"? Activate it, spawn, re-roll intent.",
      },
    ],
  },
  EvasiveManoeuvres: {
    summary: "Avoid engagement and reposition",
    actions: [
      {
        label: "1st",
        detail: "Move away from closest player, ending in cover if possible.",
      },
      {
        label: "2nd",
        detail: "Move away from closest player, ending in cover if possible.",
      },
    ],
    note: "Unique Citizen only",
  },
  CommandingOrders: {
    summary: "Command or spawn reinforcements",
    actions: [
      {
        label: "1st",
        detail:
          "Goon/Henchman in play? Pick one and re-roll their intent. None in play? D6: 1-3 spawn Goon, 4-6 spawn Henchman.",
      },
      {
        label: "2nd",
        detail:
          "Spawned a new enemy? Activate them for one action. Re-rolled intent? That enemy activates for one action.",
      },
    ],
  },
};

const UC_COMMANDING_ORDERS: IntentBehaviour = {
  summary: "Command or spawn reinforcements",
  actions: [
    {
      label: "1st",
      detail:
        "Non-UC enemy in play? Pick one and re-roll their intent. None in play? Use Standard Spawn table.",
    },
    {
      label: "2nd",
      detail:
        "Spawned a new enemy? Activate them for two actions. Re-rolled intent? That enemy activates for two actions.",
    },
  ],
};

export const getIntentBehaviour = (intent: Intent, enemyType?: EnemyType): IntentBehaviour => {
  if (intent === "CommandingOrders" && enemyType === "UniqueCitizen") {
    return UC_COMMANDING_ORDERS;
  }
  return INTENT_BEHAVIOURS[intent];
};
