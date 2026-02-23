import type { Enemy, Intent, TurnNumber } from "@/lib/types";
import { getIntentBehaviour } from "@/lib/intentBehaviour";
import styles from "./EnemyCard.module.css";

const INTENT_DISPLAY: Record<Intent, string> = {
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

interface EnemyCardProps {
  enemy: Enemy;
  currentTurn: TurnNumber;
  onUpdateStat: (
    enemyId: string,
    stat: "condition" | "energy",
    delta: number
  ) => void;
  onDefeat: (enemyId: string) => void;
  onRerollIntent: (enemyId: string) => void;
  onCommandingOrders: (enemyId: string) => void;
  spawnPending: boolean;
}

export default function EnemyCard({
  enemy,
  currentTurn,
  onUpdateStat,
  onDefeat,
  onRerollIntent,
  onCommandingOrders,
  spawnPending,
}: EnemyCardProps) {
  const cardClass = enemy.defeated
    ? `${styles.card} ${styles.defeated}`
    : styles.card;

  const behaviour = getIntentBehaviour(enemy.intent);
  const justSpawned = enemy.spawnedOnTurn === currentTurn;

  return (
    <div className={cardClass} data-type={enemy.type}>
      <div className={styles.topRow}>
        <span className={styles.typeBadge}>
          {TYPE_DISPLAY[enemy.type]} {enemy.number}
        </span>
        <div className={styles.topRowRight}>
          {justSpawned && (
            <span className={styles.spawnedBadge}>New</span>
          )}
          <span className={styles.edge}>Edge {enemy.edge}</span>
        </div>
      </div>

      {enemy.defeated ? (
        <div className={styles.defeatedLabel}>Defeated</div>
      ) : (
        <>
          <div className={styles.intentRow}>
            <span className={styles.intentLabel}>
              {INTENT_DISPLAY[enemy.intent]}
            </span>
            <button
              className={styles.rerollButton}
              onClick={() => onRerollIntent(enemy.id)}
            >
              Re-roll
            </button>
          </div>

          <div className={styles.behaviourSection}>
            <p className={styles.behaviourSummary}>{behaviour.summary}</p>
            <div className={styles.actionSteps}>
              {behaviour.actions.map((action) => (
                <div key={action.label} className={styles.actionStep}>
                  <span className={styles.actionLabel}>{action.label}</span>
                  <span className={styles.actionDetail}>{action.detail}</span>
                </div>
              ))}
            </div>
            {behaviour.note && (
              <p className={styles.behaviourNote}>{behaviour.note}</p>
            )}
            {enemy.intent === "CommandingOrders" && (
              <button
                className={styles.spawnReinforcementButton}
                disabled={spawnPending}
                onClick={() => onCommandingOrders(enemy.id)}
              >
                Spawn Reinforcement
              </button>
            )}
            <p className={styles.highGround}>
              High Ground: D6 — 1-2 First Action, 3-6 Jump On then Second Action
            </p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>STR</span>
              <span className={styles.statValue}>{enemy.strike}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>CON</span>
              <div className={styles.statEditable}>
                <button
                  className={styles.stepperButton}
                  onClick={() => onUpdateStat(enemy.id, "condition", -1)}
                >
                  -
                </button>
                <span className={styles.statValue}>{enemy.condition}</span>
                <button
                  className={styles.stepperButton}
                  onClick={() => onUpdateStat(enemy.id, "condition", 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>AGI</span>
              <span className={styles.statValue}>{enemy.agility}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>RNG</span>
              <span className={styles.statValue}>{enemy.range}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>ENG</span>
              <div className={styles.statEditable}>
                <button
                  className={styles.stepperButton}
                  onClick={() => onUpdateStat(enemy.id, "energy", -1)}
                >
                  -
                </button>
                <span className={styles.statValue}>{enemy.energy}</span>
                <button
                  className={styles.stepperButton}
                  onClick={() => onUpdateStat(enemy.id, "energy", 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>DMG</span>
              <span className={styles.statValue}>{enemy.damage}</span>
            </div>
          </div>

          <button
            className={styles.defeatButton}
            onClick={() => onDefeat(enemy.id)}
          >
            Defeated
          </button>
        </>
      )}
    </div>
  );
}
