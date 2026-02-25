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
  Goon: "Goon",
  Henchman: "Henchman",
  Lieutenant: "Lieutenant",
  UniqueCitizen: "Unique Citizen",
};

type StatName = "strike" | "condition" | "agility" | "range" | "energy" | "damage" | "ready";

interface EnemyCardProps {
  enemy: Enemy;
  currentTurn: TurnNumber;
  onUpdateStat: (
    enemyId: string,
    stat: StatName,
    delta: number
  ) => void;
  onDefeat: (enemyId: string) => void;
  onRerollIntent: (enemyId: string) => void;
  onCommandingOrders: (enemyId: string) => void;
  onRerollIntentForEnemy: (targetId: string) => void;
  onRevive: (enemyId: string) => void;
  activeNonUC: Enemy[];
  spawnPending: boolean;
}

export default function EnemyCard({
  enemy,
  currentTurn,
  onUpdateStat,
  onDefeat,
  onRerollIntent,
  onCommandingOrders,
  onRerollIntentForEnemy,
  onRevive,
  activeNonUC,
  spawnPending,
}: EnemyCardProps) {
  const cardClass = enemy.defeated
    ? `${styles.card} ${styles.defeated}`
    : styles.card;

  const behaviour = getIntentBehaviour(enemy.intent, enemy.type);
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
          <span className={styles.edge}>
            {enemy.edge !== null ? `Edge ${enemy.edge}` : "Anywhere"}
          </span>
        </div>
      </div>

      {enemy.defeated ? (
        <div className={styles.defeatedRow}>
          <span className={styles.defeatedLabel}>Defeated</span>
          <button
            className={styles.reviveButton}
            onClick={() => onRevive(enemy.id)}
          >
            Revive
          </button>
        </div>
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
              (enemy.type === "Lieutenant" || enemy.type === "UniqueCitizen") ? (
                (() => {
                  const targets = enemy.type === "Lieutenant"
                    ? activeNonUC.filter((e) => e.type === "Goon" || e.type === "Henchman")
                    : activeNonUC;
                  return targets.length > 0 ? (
                    <div className={styles.commandingTargets}>
                      <p className={styles.commandingTargetsLabel}>
                        Pick an enemy to re-roll intent:
                      </p>
                      {targets.map((target) => (
                        <button
                          key={target.id}
                          className={styles.commandingTargetButton}
                          onClick={() => onRerollIntentForEnemy(target.id)}
                        >
                          {TYPE_DISPLAY[target.type]} {target.number}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      className={styles.spawnReinforcementButton}
                      disabled={spawnPending}
                      onClick={() => onCommandingOrders(enemy.id)}
                    >
                      Spawn Reinforcement
                    </button>
                  );
                })()
              ) : null
            )}
            <p className={styles.highGround}>
              High Ground: D6 — 1-2 First Action, 3-6 Jump On then Second Action
            </p>
          </div>

          {enemy.type !== "UniqueCitizen" ? (
            <>
              <div className={styles.staticStatsRow}>
                <div className={styles.staticStat}>
                  <span className={styles.statLabel}>STR</span>
                  <span className={styles.statValue}>{enemy.strike}</span>
                </div>
                <div className={styles.staticStat}>
                  <span className={styles.statLabel}>AGI</span>
                  <span className={styles.statValue}>{enemy.agility}</span>
                </div>
                <div className={styles.staticStat}>
                  <span className={styles.statLabel}>RNG</span>
                  <span className={styles.statValue}>{enemy.range}</span>
                </div>
                <div className={styles.staticStat}>
                  <span className={styles.statLabel}>ENG</span>
                  <span className={styles.statValue}>{enemy.energy}</span>
                </div>
                <div className={styles.staticStat}>
                  <span className={styles.statLabel}>DMG</span>
                  <span className={styles.statValue}>{enemy.damage}</span>
                </div>
              </div>
              <div className={styles.trackersRow}>
                <div className={styles.trackerItem}>
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
                <div className={styles.trackerItem}>
                  <span className={styles.statLabel}>RDY</span>
                  <div className={styles.statEditable}>
                    <button
                      className={styles.stepperButton}
                      onClick={() => onUpdateStat(enemy.id, "ready", -1)}
                    >
                      -
                    </button>
                    <span className={styles.statValue}>{enemy.ready}</span>
                    <button
                      className={styles.stepperButton}
                      onClick={() => onUpdateStat(enemy.id, "ready", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.staticStatsRow}>
                {([
                  { label: "STR", stat: "strike" as StatName },
                  { label: "AGI", stat: "agility" as StatName },
                  { label: "RNG", stat: "range" as StatName },
                  { label: "ENG", stat: "energy" as StatName },
                  { label: "DMG", stat: "damage" as StatName },
                ]).map(({ label, stat }) => (
                  <div key={stat} className={styles.trackerItem}>
                    <span className={styles.statLabel}>{label}</span>
                    <div className={styles.statEditable}>
                      <button
                        className={styles.stepperButton}
                        onClick={() => onUpdateStat(enemy.id, stat, -1)}
                      >
                        -
                      </button>
                      <span className={styles.statValue}>{enemy[stat]}</span>
                      <button
                        className={styles.stepperButton}
                        onClick={() => onUpdateStat(enemy.id, stat, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.trackersRow}>
                <div className={styles.trackerItem}>
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
                <div className={styles.trackerItem}>
                  <span className={styles.statLabel}>RDY</span>
                  <div className={styles.statEditable}>
                    <button
                      className={styles.stepperButton}
                      onClick={() => onUpdateStat(enemy.id, "ready", -1)}
                    >
                      -
                    </button>
                    <span className={styles.statValue}>{enemy.ready}</span>
                    <button
                      className={styles.stepperButton}
                      onClick={() => onUpdateStat(enemy.id, "ready", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

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
