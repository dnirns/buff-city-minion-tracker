import Link from "next/link";
import styles from "./page.module.css";

export default function NotFound() {
  return (
    <div className={styles.errorPage}>
      <h1>Page not found</h1>
      <p>This page doesn&apos;t exist.</p>
      <Link href="/" className={styles.homeLink}>
        Back to Home
      </Link>
    </div>
  );
}
