"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getGameBySlug, type GameSummary } from "@/lib/gameState";
import styles from "./page.module.css";

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const { slug } = use(params);
  const [game, setGame] = useState<GameSummary | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setGame(getGameBySlug(slug));
    setChecked(true);
  }, [slug]);

  if (!checked) return null;

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
        <Link href="/" className={styles.backLink}>&larr; Home</Link>
        <h1>{game.gameName}</h1>
      </header>
      <main className={styles.main}>
        <p>Minion spawning will go here.</p>
      </main>
    </div>
  );
}
