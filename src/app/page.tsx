'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NewGameModal from '@/components/NewGameModal/NewGameModal'
import { getSavedGames, deleteGame, type GameSummary } from '@/lib/gameState'
import styles from './page.module.css'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savedGames, setSavedGames] = useState<GameSummary[]>([])

  useEffect(() => {
    setSavedGames(getSavedGames())
  }, [])

  function handleModalClose() {
    setIsModalOpen(false)
    setSavedGames(getSavedGames())
  }

  function handleDelete(slug: string, gameName: string) {
    if (!confirm(`Delete "${gameName}"? This cannot be undone.`)) return
    deleteGame(slug)
    setSavedGames(getSavedGames())
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>BUFF CITY BloKWaRZ</h1>
        <p className={styles.subtitle}>Minion Tracker</p>
        <button className={styles.startButton} onClick={() => setIsModalOpen(true)}>
          Start New Game
        </button>
        {savedGames.length > 0 && (
          <section className={styles.savedGames}>
            <h2 className={styles.savedGamesTitle}>Saved Games</h2>
            <ul className={styles.gameList}>
              {savedGames.map((game) => (
                <li key={game.slug} className={styles.gameItem}>
                  <Link href={`/game/${game.slug}`} className={styles.gameLink}>
                    {game.gameName}
                  </Link>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(game.slug, game.gameName)}
                    aria-label={`Delete ${game.gameName}`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <NewGameModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  )
}
