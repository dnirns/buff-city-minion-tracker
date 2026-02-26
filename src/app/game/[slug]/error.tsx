'use client'

import Link from 'next/link'
import styles from './page.module.css'

const GameError = () => {
  return (
    <div className={styles.page}>
      <main className={styles.notFound}>
        <h1>Something went wrong</h1>
        <p>There was an error loading this game.</p>
        <Link href='/' className={styles.homeLink}>
          Back to Home
        </Link>
      </main>
    </div>
  )
}

export default GameError
