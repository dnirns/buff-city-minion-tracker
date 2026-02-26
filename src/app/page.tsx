'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import NewGameModal from '@/components/NewGameModal/NewGameModal'
import Button from '@/components/Button/Button'
import { getSavedGames, deleteGame, type GameSummary } from '@/lib/gameState'
import styles from './page.module.css'

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savedGames, setSavedGames] = useState<GameSummary[]>([])

  useEffect(() => {
    setSavedGames(getSavedGames())
  }, [])

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSavedGames(getSavedGames())
  }

  const handleDelete = (slug: string, gameName: string) => {
    if (!confirm(`Delete "${gameName}"? This cannot be undone.`)) return
    deleteGame(slug)
    setSavedGames(getSavedGames())
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          src="/assets/logo-transparent.svg"
          alt="Buff City BloKWaRZ"
          width={240}
          height={240}
          className={styles.logo}
          priority
        />
        <p className={styles.subtitle}>Minion Tracker</p>
        <Button onClick={() => setIsModalOpen(true)}>
          Start New Game
        </Button>
        {savedGames.length > 0 && (
          <section className={styles.savedGames}>
            <h2 className={styles.savedGamesTitle}>Saved Games</h2>
            <ul className={styles.gameList}>
              {savedGames.map((game) => (
                <li key={game.slug} className={styles.gameItem}>
                  <Link href={`/game/${game.slug}`} className={styles.gameLink}>
                    {game.gameName}
                  </Link>
                  <Button
                    variant="icon"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(game.slug, game.gameName)}
                    aria-label={`Delete ${game.gameName}`}
                  >
                    &times;
                  </Button>
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

export default Home
