"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { saveGame } from "@/lib/gameState";
import styles from "./NewGameModal.module.css";

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewGameModal({ isOpen, onClose }: NewGameModalProps) {
  const [gameName, setGameName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setGameName("");
      setError("");
    }
  }, [isOpen]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = gameName.trim();
    if (!trimmed) {
      setError("Please enter a game name.");
      return;
    }
    const slug = slugify(trimmed);
    if (!slug) {
      setError("Please enter a valid name with at least one letter or number.");
      return;
    }
    saveGame(trimmed, slug);
    router.push(`/game/${slug}`);
  }

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Start New Game</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="gameName">Game Name</label>
          <input
            ref={inputRef}
            id="gameName"
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="e.g. Friday Night Showdown"
            maxLength={50}
            autoComplete="off"
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
