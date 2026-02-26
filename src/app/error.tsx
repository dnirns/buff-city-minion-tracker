"use client";

import Link from "next/link";
import styles from "./page.module.css";

const HomeError = () => {
  return (
    <div className={styles.errorPage}>
      <h1>Something went wrong</h1>
      <p>There was an error loading the app.</p>
      <Link href="/" className={styles.homeLink}>
        Back to Home
      </Link>
    </div>
  );
};

export default HomeError;
