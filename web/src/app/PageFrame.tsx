import type { ReactNode } from "react";
import { Link, useMatch } from "react-router";
import { copy } from "../copy/en";
import styles from "./PageFrame.module.css";

interface PageFrameProps {
  /** What the header shows after the product name, in reading order. */
  header?: ReactNode;
  /** A reading page grows with its content and the window scrolls; steps fit the window. */
  flow?: "fit" | "document";
  children: ReactNode;
}

/**
 * The frame of every screen: a header that starts with the product name, the main area, and a
 * footer with the disclaimer, which docs/design.md requires once on every screen, and the link to
 * the evaluation. Rendering them here is what keeps each to exactly once.
 */
export function PageFrame({ header, flow = "fit", children }: PageFrameProps) {
  // The evaluation's link sits in every footer but its own page's, where the title says it.
  const onEvaluation = useMatch("/evaluation") !== null;
  return (
    <div className={styles.page} data-flow={flow}>
      <header className={styles.header}>
        <Link to="/" className={styles.product}>
          {copy.product}
        </Link>
        {header}
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p className={styles.disclaimer}>{copy.disclaimer}</p>
        {!onEvaluation && (
          <Link to="/evaluation" className={styles.evaluation}>
            {copy.evaluation.title}
          </Link>
        )}
      </footer>
    </div>
  );
}

interface PageBodyProps {
  title: string;
  intro: string;
  /** The screen's figure. */
  children: ReactNode;
}

/** A screen's title, said once and also as the document title; its intro; then its figure. */
export function PageBody({ title, intro, children }: PageBodyProps) {
  return (
    <>
      <title>{`${title} - ${copy.product}`}</title>
      <div className={styles.head}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </div>
      <div className={styles.figure}>{children}</div>
    </>
  );
}
