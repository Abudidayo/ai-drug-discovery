import type { ReactNode } from "react";
import { Link } from "react-router";
import { copy } from "../copy/en";
import styles from "./PageFrame.module.css";

interface PageFrameProps {
  /** What the header shows after the product name, in reading order. */
  header?: ReactNode;
  children: ReactNode;
}

/**
 * The frame of every screen: a header that starts with the product name, the main area, and the
 * disclaimer, which docs/design.md requires once on every screen. Rendering it here is what keeps
 * it to exactly once.
 */
export function PageFrame({ header, children }: PageFrameProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.product}>
          {copy.product}
        </Link>
        {header}
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p className={styles.disclaimer}>{copy.disclaimer}</p>
      </footer>
    </div>
  );
}
