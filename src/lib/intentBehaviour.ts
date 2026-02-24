import type { Intent } from "./types";

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
    summary: "Spawn reinforcements",
    actions: [
      {
        label: "Spawn",
        detail: "D6: 1-3 spawn Goon, 4-6 spawn Henchman.",
      },
    ],
    note: "If Unique Citizen and no Goons in play: use Standard Spawn table instead.",
  },
};

export function getIntentBehaviour(intent: Intent): IntentBehaviour {
  return INTENT_BEHAVIOURS[intent];
}
