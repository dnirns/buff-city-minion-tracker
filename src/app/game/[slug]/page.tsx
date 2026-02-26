'use client'

import { use, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getGameBySlug, initGameState, saveGameState } from '@/lib/gameState'
import type { Enemy } from '@/lib/types'
import { performSpawn, performCommandingOrdersSpawn, createEnemy } from '@/lib/spawner'
import { rollD12 } from '@/lib/dice'
import { lookupIntent } from '@/lib/intentTable'
import EnemyCard from '@/components/EnemyCard/EnemyCard'
import DiceRoller, { type DiceStep } from '@/components/DiceRoller/DiceRoller'
import Button from '@/components/Button/Button'
import DefeatAnimation from '@/components/DefeatAnimation/DefeatAnimation'
import { TYPE_DISPLAY, INTENT_DISPLAY, MAX_TURN } from '@/lib/constants'
import { gameReducer, INITIAL_STATE } from '@/lib/gameReducer'
import styles from './page.module.css'

interface GamePageProps {
  params: Promise<{ slug: string }>
}

interface PendingSpawn {
  result: import('@/lib/types').SpawnResult
  enemy: Enemy
  steps: DiceStep[]
}

const GamePage = ({ params }: GamePageProps) => {
  const { slug } = use(params)

  const [game, setGame] = useState<ReturnType<typeof getGameBySlug> | undefined>(undefined)
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE)
  const [pendingSpawn, setPendingSpawn] = useState<PendingSpawn | null>(null)
  const [pendingDefeatId, setPendingDefeatId] = useState<string | null>(null)
  const [pendingReroll, setPendingReroll] = useState<{
    targetId: string
    intent: import('@/lib/types').Intent
    steps: DiceStep[]
  } | null>(null)
  const skipFirstSave = useRef(true)

  useEffect(() => {
    const savedGame = getGameBySlug(slug)
    setGame(savedGame)
    if (savedGame) {
      dispatch({ type: 'LOAD', state: initGameState(savedGame.gameName, slug) })
    }
  }, [slug])

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false
      return
    }
    if (game) {
      saveGameState(state)
    }
  }, [state, game])

  const handleSpawn = useCallback(() => {
    if (state.turn === MAX_TURN) return

    const result = performSpawn({
      turn: state.turn,
      lieutenantSpawned: state.lieutenantSpawned,
      uniqueCitizenSpawned: state.uniqueCitizenSpawned,
    })

    if (!result) return

    const nextNumber = state.enemyNumbers[result.enemyType] + 1
    const enemy = createEnemy(result, state.turn, nextNumber)

    const steps: DiceStep[] = [
      {
        label: 'Spawn Type',
        sides: 12,
        finalValue: result.rolls.spawnRoll,
        resultText: TYPE_DISPLAY[result.enemyType],
      },
    ]

    if (result.edge !== null) {
      steps.push({
        label: 'Board Edge',
        sides: 4,
        finalValue: result.rolls.edgeRoll,
        resultText: `Edge ${result.edge}`,
      })
    }

    steps.push({
      label: 'Intent',
      sides: 12,
      finalValue: result.rolls.intentRoll,
      resultText: INTENT_DISPLAY[result.intent],
    })

    setPendingSpawn({ result, enemy, steps })
  }, [state.turn, state.lieutenantSpawned, state.uniqueCitizenSpawned, state.enemyNumbers])

  const handleDiceComplete = useCallback(() => {
    if (!pendingSpawn) return

    const { result, enemy } = pendingSpawn
    dispatch({ type: 'SPAWN_ENEMY', enemy, enemyType: result.enemyType })
    setPendingSpawn(null)
  }, [pendingSpawn])

  const handleUpdateStat = useCallback(
    (
      enemyId: string,
      stat: 'strike' | 'condition' | 'agility' | 'range' | 'energy' | 'damage' | 'ready',
      delta: number,
    ) => {
      dispatch({ type: 'UPDATE_STAT', enemyId, stat, delta })
    },
    [],
  )

  const handleDefeat = useCallback((enemyId: string) => {
    setPendingDefeatId(enemyId)
  }, [])

  const handleDefeatAnimationComplete = useCallback(() => {
    if (pendingDefeatId) {
      dispatch({ type: 'DEFEAT_ENEMY', enemyId: pendingDefeatId })
      setPendingDefeatId(null)
    }
  }, [pendingDefeatId])

  const handleRevive = useCallback((enemyId: string) => {
    dispatch({ type: 'REVIVE_ENEMY', enemyId })
  }, [])

  const handleRename = useCallback((enemyId: string, displayName: string) => {
    dispatch({ type: 'RENAME_ENEMY', enemyId, displayName })
  }, [])

  const handleRerollIntent = useCallback((enemyId: string) => {
    dispatch({ type: 'REROLL_INTENT', enemyId })
  }, [])

  const handleCommandingOrders = useCallback(
    (enemyId: string) => {
      const source = state.enemies.find((e) => e.id === enemyId)
      if (!source) return

      const activeNonUCCount = state.enemies.filter((e) => e.type !== 'UniqueCitizen' && !e.defeated).length

      const result = performCommandingOrdersSpawn({
        sourceType: source.type,
        turn: state.turn,
        activeNonUCCount,
      })

      if (!result) return

      const nextNumber = state.enemyNumbers[result.enemyType] + 1
      const enemy = createEnemy(result, state.turn, nextNumber)

      const steps: DiceStep[] = result.usedStandardSpawn
        ? [
            {
              label: 'Spawn Type',
              sides: 12,
              finalValue: result.commandingRoll,
              resultText: TYPE_DISPLAY[result.enemyType],
            },
          ]
        : [
            {
              label: 'Reinforcement',
              sides: 6,
              finalValue: result.commandingRoll,
              resultText: TYPE_DISPLAY[result.enemyType],
            },
          ]

      steps.push(
        {
          label: 'Board Edge',
          sides: 4,
          finalValue: result.rolls.edgeRoll,
          resultText: `Edge ${result.edge}`,
        },
        {
          label: 'Intent',
          sides: 12,
          finalValue: result.rolls.intentRoll,
          resultText: INTENT_DISPLAY[result.intent],
        },
      )

      setPendingSpawn({ result, enemy, steps })
    },
    [state.enemies, state.turn, state.enemyNumbers],
  )

  const activeNonUC = useMemo(
    () => state.enemies.filter((e) => e.type !== 'UniqueCitizen' && !e.defeated),
    [state.enemies],
  )

  const handleRerollIntentForEnemy = useCallback(
    (targetId: string) => {
      const target = state.enemies.find((e) => e.id === targetId)
      if (!target) return

      const intentRoll = rollD12()
      const newIntent = lookupIntent(target.type, intentRoll)

      const steps: DiceStep[] = [
        {
          label: `${target.displayName} — New Intent`,
          sides: 12,
          finalValue: intentRoll,
          resultText: INTENT_DISPLAY[newIntent],
        },
      ]

      setPendingReroll({ targetId, intent: newIntent, steps })
    },
    [state.enemies],
  )

  const handleRerollComplete = useCallback(() => {
    if (!pendingReroll) return
    dispatch({ type: 'SET_INTENT', enemyId: pendingReroll.targetId, intent: pendingReroll.intent })
    setPendingReroll(null)
  }, [pendingReroll])

  const sortedEnemies = useMemo(() => {
    const active = state.enemies.filter((e) => !e.defeated).reverse()
    const defeated = state.enemies.filter((e) => e.defeated)
    return [...active, ...defeated]
  }, [state.enemies])

  if (game === undefined) {
    return <div className={styles.page} />
  }

  if (game === null) {
    return (
      <div className={styles.page}>
        <main className={styles.notFound}>
          <h1>Game not found</h1>
          <p>This game doesn&apos;t exist or has been removed.</p>
          <Link href='/' className={styles.homeLink}>
            Back to Home
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href='/' className={styles.backLink}>
          &larr; Home
        </Link>
        <Image
          src='/assets/logo-transparent.svg'
          alt='Buff City BloKWaRZ'
          width={48}
          height={48}
          className={styles.headerLogo}
        />
        <h1>{state.gameName}</h1>
      </header>

      <div className={styles.turnControls}>
        <Button variant='secondary' disabled={state.turn <= 1} onClick={() => dispatch({ type: 'RETREAT_TURN' })}>
          &larr;
        </Button>
        <span className={styles.turnLabel}>Turn {state.turn}</span>
        <Button variant='secondary' disabled={state.turn >= MAX_TURN} onClick={() => dispatch({ type: 'ADVANCE_TURN' })}>
          &rarr;
        </Button>
      </div>

      <Button
        fullWidth
        className={styles.spawnButton}
        disabled={state.turn === MAX_TURN || pendingSpawn !== null}
        onClick={handleSpawn}
      >
        {state.turn === MAX_TURN ? `No Spawns on Turn ${MAX_TURN}` : 'Activate Buff Token'}
      </Button>

      {pendingDefeatId &&
        (() => {
          const enemy = state.enemies.find((e) => e.id === pendingDefeatId)
          if (!enemy) return null
          return (
            <DefeatAnimation
              enemyName={enemy.displayName}
              enemyType={TYPE_DISPLAY[enemy.type]}
              onComplete={handleDefeatAnimationComplete}
            />
          )
        })()}

      {pendingSpawn && <DiceRoller steps={pendingSpawn.steps} onComplete={handleDiceComplete} />}

      {pendingReroll && <DiceRoller steps={pendingReroll.steps} onComplete={handleRerollComplete} />}

      {state.enemies.length === 0 ? (
        <p className={styles.emptyState}>No enemies on the board. Activate a Buff Token to spawn.</p>
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
              onCommandingOrders={handleCommandingOrders}
              onRerollIntentForEnemy={handleRerollIntentForEnemy}
              onRename={handleRename}
              onRevive={handleRevive}
              activeNonUC={activeNonUC}
              spawnPending={pendingSpawn !== null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default GamePage
