import type { GameState, Enemy, EnemyType, TurnNumber, Intent } from "./types";
import { rollD12 } from "./dice";
import { lookupIntent } from "./intentTable";
import { MAX_TURN, INITIAL_ENEMY_NUMBERS } from "./constants";

export type GameAction =
  | { type: 'LOAD'; state: GameState }
  | { type: 'ADVANCE_TURN' }
  | { type: 'RETREAT_TURN' }
  | { type: 'SPAWN_ENEMY'; enemy: Enemy; enemyType: EnemyType }
  | { type: 'DEFEAT_ENEMY'; enemyId: string }
  | {
      type: 'UPDATE_STAT'
      enemyId: string
      stat: 'strike' | 'condition' | 'agility' | 'range' | 'energy' | 'damage' | 'ready'
      delta: number
    }
  | { type: 'REROLL_INTENT'; enemyId: string }
  | { type: 'SET_INTENT'; enemyId: string; intent: Intent }
  | { type: 'REVIVE_ENEMY'; enemyId: string }
  | { type: 'RENAME_ENEMY'; enemyId: string; displayName: string }

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD':
      return action.state

    case 'ADVANCE_TURN': {
      if (state.turn >= MAX_TURN) return state
      return { ...state, turn: (state.turn + 1) as TurnNumber }
    }

    case 'RETREAT_TURN': {
      if (state.turn <= 1) return state
      return { ...state, turn: (state.turn - 1) as TurnNumber }
    }

    case 'SPAWN_ENEMY': {
      const newEnemyNumbers = {
        ...state.enemyNumbers,
        [action.enemyType]: state.enemyNumbers[action.enemyType] + 1,
      }
      return {
        ...state,
        enemies: [...state.enemies, action.enemy],
        enemyNumbers: newEnemyNumbers,
        uniqueCitizenSpawned: action.enemyType === 'UniqueCitizen' ? true : state.uniqueCitizenSpawned,
        lieutenantSpawned: action.enemyType === 'Lieutenant' ? true : state.lieutenantSpawned,
      }
    }

    case 'DEFEAT_ENEMY':
      return {
        ...state,
        enemies: state.enemies.map((e) => (e.id === action.enemyId ? { ...e, defeated: true } : e)),
      }

    case 'UPDATE_STAT':
      return {
        ...state,
        enemies: state.enemies.map((e) => {
          if (e.id !== action.enemyId) return e
          const newValue = e[action.stat] + action.delta
          const maxValue = action.stat === 'ready' ? 6 : Infinity
          return { ...e, [action.stat]: Math.min(maxValue, Math.max(0, newValue)) }
        }),
      }

    case 'REROLL_INTENT':
      return {
        ...state,
        enemies: state.enemies.map((e) => {
          if (e.id !== action.enemyId) return e
          const newIntent = lookupIntent(e.type, rollD12())
          return { ...e, intent: newIntent }
        }),
      }

    case 'SET_INTENT':
      return {
        ...state,
        enemies: state.enemies.map((e) => (e.id === action.enemyId ? { ...e, intent: action.intent } : e)),
      }

    case 'REVIVE_ENEMY':
      return {
        ...state,
        enemies: state.enemies.map((e) => (e.id === action.enemyId ? { ...e, defeated: false } : e)),
      }

    case 'RENAME_ENEMY':
      return {
        ...state,
        enemies: state.enemies.map((e) => (e.id === action.enemyId ? { ...e, displayName: action.displayName } : e)),
      }

    default:
      return state
  }
}

export const INITIAL_STATE: GameState = {
  gameName: '',
  slug: '',
  createdAt: 0,
  turn: 1,
  lieutenantSpawned: false,
  uniqueCitizenSpawned: false,
  enemyNumbers: { ...INITIAL_ENEMY_NUMBERS },
  enemies: [],
}
