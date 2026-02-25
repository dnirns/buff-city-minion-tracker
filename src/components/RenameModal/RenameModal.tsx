import { useState, useCallback, type FormEvent } from "react";
import Button from "@/components/Button/Button";
import styles from "./RenameModal.module.css";

interface RenameModalProps {
  currentName: string;
  onSave: (newName: string) => void;
  onClose: () => void;
}

export default function RenameModal({ currentName, onSave, onClose }: RenameModalProps) {
  const [name, setName] = useState(currentName);

  const inputCallbackRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
      node.select();
    }
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Rename</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="enemyName">Name</label>
          <input
            ref={inputCallbackRef}
            id="enemyName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoComplete="off"
          />
          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={onClose} className={styles.actionButton}>
              Cancel
            </Button>
            <Button type="submit" className={styles.actionButton}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
