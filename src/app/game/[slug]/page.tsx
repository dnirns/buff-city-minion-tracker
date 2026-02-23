"use client";

import { use, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { getGameBySlug, initGameState, saveGameState } from "@/lib/gameState";
import type { GameState, Enemy, EnemyType, TurnNumber } from "@/lib/types";
import { performSpawn, createEnemy } from "@/lib/spawner";
import { rollD12 } from "@/lib/dice";
import { lookupIntent } from "@/lib/intentTable";
import EnemyCard from "@/components/EnemyCard/EnemyCard";
import DiceRoller, { type DiceStep } from "@/components/DiceRoller/DiceRoller";
import styles from "./page.module.css";

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

const INTENT_DISPLAY: Record<string, string> = {
  Combat: "Combat",
  Slam: "Slam",
  BuffTokenDenial: "Buff Token Denial",
  EvasiveManoeuvres: "Evasive Manoeuvres",
  CommandingOrders: "Commanding Orders",
};

const TYPE_DISPLAY: Record<string, string> = {
  Minion: "Minion",
  Muscle: "Muscle",
  Lieutenant: "Lieutenant",
  UniqueCitizen: "Unique Citizen",
};

type GameAction =
  | { type: "LOAD"; state: GameState }
  | { type: "ADVANCE_TURN" }
  | { type: "RETREAT_TURN" }
  | { type: "SPAWN_ENEMY"; enemy: Enemy; enemyType: EnemyType }
  | { type: "DEFEAT_ENEMY"; enemyId: string }
  | { type: "UPDATE_STAT"; enemyId: string; stat: "condition" | "energy"; delta: number }
  | { type: "REROLL_INTENT"; enemyId: string };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD":
      return action.state;

    case "ADVANCE_TURN": {
      if (state.turn >= 10) return state;
      return { ...state, turn: (state.turn + 1) as TurnNumber };
    }

    case "RETREAT_TURN": {
      if (state.turn <= 1) return state;
      return { ...state, turn: (state.turn - 1) as TurnNumber };
    }

    case "SPAWN_ENEMY": {
      const newEnemyNumbers = {
        ...state.enemyNumbers,
        [action.enemyType]: state.enemyNumbers[action.enemyType] + 1,
      };
      const isUniqueCitizen = action.enemyType === "UniqueCitizen";
      const isMinion = action.enemyType === "Minion";
      return {
        ...state,
        enemies: [...state.enemies, action.enemy],
        enemyNumbers: newEnemyNumbers,
        uniqueCitizenSpawned: isUniqueCitizen ? true : state.uniqueCitizenSpawned,
        minionCounter: isMinion ? state.minionCounter + 1 : state.minionCounter,
      };
    }

    case "DEFEAT_ENEMY":
      return {
        ...state,
        enemies: state.enemies.map((e) =>
          e.id === action.enemyId ? { ...e, defeated: true } : e
        ),
      };

    case "UPDATE_STAT":
      return {
        ...state,
        enemies: state.enemies.map((e) => {
          if (e.id !== action.enemyId) return e;
          const newValue = e[action.stat] + action.delta;
          return { ...e, [action.stat]: Math.max(0, newValue) };
        }),
      };

    case "REROLL_INTENT":
      return {
        ...state,
        enemies: state.enemies.map((e) => {
          if (e.id !== action.enemyId) return e;
          const newIntent = lookupIntent(e.type, rollD12());
          return { ...e, intent: newIntent };
        }),
      };

    default:
      return state;
  }
}

const INITIAL_STATE: GameState = {
  gameName: "",
  slug: "",
  createdAt: 0,
  turn: 1,
  minionCounter: 0,
  uniqueCitizenSpawned: false,
  enemyNumbers: { Minion: 0, Muscle: 0, Lieutenant: 0, UniqueCitizen: 0 },
  enemies: [],
};

interface PendingSpawn {
  result: import("@/lib/types").SpawnResult;
  enemy: Enemy;
  steps: DiceStep[];
}

export default function GamePage({ params }: GamePageProps) {
  const { slug } = use(params);

  const game = useMemo(() => getGameBySlug(slug), [slug]);

  const [state, dispatch] = useReducer(
    gameReducer,
    { game, slug },
    ({ game: g, slug: s }) => {
      if (!g) return INITIAL_STATE;
      return initGameState(g.gameName, s);
    }
  );
  const [pendingSpawn, setPendingSpawn] = useState<PendingSpawn | null>(null);
  const skipFirstSave = useRef(true);

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    if (game) {
      saveGameState(state);
    }
  }, [state, game]);

  const handleSpawn = useCallback(() => {
    if (state.turn === 10) return;

    const result = performSpawn({
      turn: state.turn,
      minionCounter: state.minionCounter,
      uniqueCitizenSpawned: state.uniqueCitizenSpawned,
    });

    if (!result) return;

    const nextNumber = state.enemyNumbers[result.enemyType] + 1;
    const enemy = createEnemy(result, state.turn, nextNumber);

    const steps: DiceStep[] = [
      {
        label: "Spawn Type",
        sides: 12,
        finalValue: result.rolls.spawnRoll,
        resultText: TYPE_DISPLAY[result.enemyType],
      },
      {
        label: "Board Edge",
        sides: 4,
        finalValue: result.rolls.edgeRoll,
        resultText: `Edge ${result.edge}`,
      },
      {
        label: "Intent",
        sides: 12,
        finalValue: result.rolls.intentRoll,
        resultText: INTENT_DISPLAY[result.intent],
      },
    ];

    setPendingSpawn({ result, enemy, steps });
  }, [state.turn, state.minionCounter, state.uniqueCitizenSpawned, state.enemyNumbers]);

  const handleDiceComplete = useCallback(() => {
    if (!pendingSpawn) return;

    const { result, enemy } = pendingSpawn;
    dispatch({ type: "SPAWN_ENEMY", enemy, enemyType: result.enemyType });
    setPendingSpawn(null);
  }, [pendingSpawn]);

  const handleUpdateStat = useCallback(
    (enemyId: string, stat: "condition" | "energy", delta: number) => {
      dispatch({ type: "UPDATE_STAT", enemyId, stat, delta });
    },
    []
  );

  const handleDefeat = useCallback((enemyId: string) => {
    dispatch({ type: "DEFEAT_ENEMY", enemyId });
  }, []);

  const handleRerollIntent = useCallback((enemyId: string) => {
    dispatch({ type: "REROLL_INTENT", enemyId });
  }, []);

  const sortedEnemies = useMemo(() => {
    const active = state.enemies.filter((e) => !e.defeated).reverse();
    const defeated = state.enemies.filter((e) => e.defeated);
    return [...active, ...defeated];
  }, [state.enemies]);

  if (!game) {
    return (
      <div className={styles.page}>
        <main className={styles.notFound}>
          <h1>Game not found</h1>
          <p>This game doesn&apos;t exist or has been removed.</p>
          <Link href="/" className={styles.homeLink}>
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          &larr; Home
        </Link>
        <h1>{state.gameName}</h1>
      </header>

      <div className={styles.turnControls}>
        <button
          className={styles.turnButton}
          disabled={state.turn <= 1}
          onClick={() => dispatch({ type: "RETREAT_TURN" })}
        >
          &larr;
        </button>
        <span className={styles.turnLabel}>Turn {state.turn}</span>
        <button
          className={styles.turnButton}
          disabled={state.turn >= 10}
          onClick={() => dispatch({ type: "ADVANCE_TURN" })}
        >
          &rarr;
        </button>
      </div>

      <button
        className={styles.spawnButton}
        disabled={state.turn === 10 || pendingSpawn !== null}
        onClick={handleSpawn}
      >
        {state.turn === 10 ? "No Spawns on Turn 10" : "Activate Buff Token"}
      </button>

      {pendingSpawn && (
        <DiceRoller
          steps={pendingSpawn.steps}
          onComplete={handleDiceComplete}
        />
      )}

      {state.enemies.length === 0 ? (
        <p className={styles.emptyState}>
          No enemies on the board. Activate a Buff Token to spawn.
        </p>
      ) : (
        <div className={styles.enemyList}>
          {sortedEnemies.map((enemy) => (
            <EnemyCard
              key={enemy.id}
              enemy={enemy}
              currentTurn={state.turn}
              onUpdateStat={handleUpdateStat}
              onDefeat={handleDefeat}
              onRerollIntent={handleRerollIntent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
