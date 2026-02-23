"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NewGameModal from "@/components/NewGameModal/NewGameModal";
import { getSavedGames, type GameSummary } from "@/lib/gameState";
import styles from "./page.module.css";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedGames, setSavedGames] = useState<GameSummary[]>([]);

  useEffect(() => {
    setSavedGames(getSavedGames());
  }, []);

  function handleModalClose() {
    setIsModalOpen(false);
    setSavedGames(getSavedGames());
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Blok City Warz</h1>
        <p className={styles.subtitle}>Minion Tracker</p>
        <button
          className={styles.startButton}
          onClick={() => setIsModalOpen(true)}
        >
          Start New Game
        </button>
        {savedGames.length > 0 && (
          <section className={styles.savedGames}>
            <h2 className={styles.savedGamesTitle}>Saved Games</h2>
            <ul className={styles.gameList}>
              {savedGames.map((game) => (
                <li key={game.slug}>
                  <Link href={`/game/${game.slug}`} className={styles.gameLink}>
                    {game.gameName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <NewGameModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
