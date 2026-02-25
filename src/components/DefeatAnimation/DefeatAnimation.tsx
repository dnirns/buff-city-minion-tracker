'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './DefeatAnimation.module.css'

const ANIMATION_DURATION = 2200

interface DefeatAnimationProps {
  enemyName: string
  enemyType: string
  onComplete: () => void
}

export default function DefeatAnimation({ enemyName, enemyType, onComplete }: DefeatAnimationProps) {
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current()
    }, ANIMATION_DURATION)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <Image
          src="/assets/oz-transparent.svg"
          alt="Defeated"
          width={400}
          height={400}
          className={styles.ozImage}
          priority
        />
        <span className={styles.name}>{enemyName} ({enemyType})</span>
        <span className={styles.label}>Wasted</span>
      </div>
    </div>
  )
}
