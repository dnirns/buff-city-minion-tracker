import type { GameState } from "./types";
import { TYPE_DISPLAY, INITIAL_ENEMY_NUMBERS } from "./constants";

const STORAGE_KEY = "bcw-games";
const GAME_STATE_PREFIX = "bcw-game-";

export interface GameSummary {
  gameName: string;
  slug: string;
  createdAt: number;
}

export const getSavedGames = (): GameSummary[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameSummary[];
  } catch {
    return [];
  }
};

export const saveGame = (gameName: string, slug: string): void => {
  if (typeof window === "undefined") return;
  const games = getSavedGames();
  const existing = games.find((g) => g.slug === slug);
  if (existing) return;
  games.push({ gameName, slug, createdAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
};

export const deleteGame = (slug: string): void => {
  if (typeof window === "undefined") return;
  const games = getSavedGames().filter((g) => g.slug !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  localStorage.removeItem(`${GAME_STATE_PREFIX}${slug}`);
};

export const getGameBySlug = (slug: string): GameSummary | null => {
  return getSavedGames().find((g) => g.slug === slug) ?? null;
};

const gameStateKey = (slug: string): string => {
  return `${GAME_STATE_PREFIX}${slug}`;
};

export const getGameState = (slug: string): GameState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(gameStateKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
};

export const saveGameState = (state: GameState): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(gameStateKey(state.slug), JSON.stringify(state));
};

export const initGameState = (gameName: string, slug: string): GameState => {
  const existing = getGameState(slug);
  if (existing) {
    const needsMigration = existing.enemies.some((e) => !e.displayName);
    if (needsMigration) {
      existing.enemies = existing.enemies.map((e) =>
        e.displayName ? e : { ...e, displayName: `${TYPE_DISPLAY[e.type]} ${e.number}` }
      );
      saveGameState(existing);
    }
    return existing;
  }
  const state: GameState = {
    gameName,
    slug,
    createdAt: Date.now(),
    turn: 1,
    lieutenantSpawned: false,
    uniqueCitizenSpawned: false,
    enemyNumbers: { ...INITIAL_ENEMY_NUMBERS },
    enemies: [],
  };
  saveGameState(state);
  return state;
};
