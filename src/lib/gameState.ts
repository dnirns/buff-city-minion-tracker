const STORAGE_KEY = "bcw-games";

export interface GameSummary {
  gameName: string;
  slug: string;
  createdAt: number;
}

export function getSavedGames(): GameSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameSummary[];
  } catch {
    return [];
  }
}

export function saveGame(gameName: string, slug: string): void {
  if (typeof window === "undefined") return;
  const games = getSavedGames();
  const existing = games.find((g) => g.slug === slug);
  if (existing) return;
  games.push({ gameName, slug, createdAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function getGameBySlug(slug: string): GameSummary | null {
  return getSavedGames().find((g) => g.slug === slug) ?? null;
}
