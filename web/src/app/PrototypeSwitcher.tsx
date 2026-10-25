import { useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { usePrototypeVariant, type PrototypeVariant } from "./prototypeVariant";
import styles from "./PrototypeSwitcher.module.css";

/*
 * PROTOTYPE, throwaway. A discreet bar that cycles `?variant=` through a prototype's variants,
 * so each variant has its own shareable URL. Left and Right arrow keys cycle too. It shows in
 * development, or anywhere once a `?variant=` link has been shared.
 */

const EDITABLE = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

export function PrototypeSwitcher({
  variants,
}: {
  variants: readonly [PrototypeVariant, ...PrototypeVariant[]];
}) {
  const [params, setParams] = useSearchParams();
  const current = usePrototypeVariant(variants);
  const index = variants.indexOf(current);

  const search = useCallback(
    (offset: number) => {
      const next = variants[(index + offset + variants.length) % variants.length] ?? current;
      const updated = new URLSearchParams(params);
      updated.set("variant", next.key);
      return `?${updated.toString()}`;
    },
    [variants, index, current, params],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest(EDITABLE)) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      setParams(new URLSearchParams(search(event.key === "ArrowLeft" ? -1 : 1)), {
        replace: true,
      });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [search, setParams]);

  if (!import.meta.env.DEV && !params.has("variant")) return null;

  return (
    <nav className={styles.bar} aria-label="Prototype variants">
      <Link className={styles.arrow} to={search(-1)} replace aria-label="Previous variant">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M10 3 5 8l5 5" />
        </svg>
      </Link>
      <span className={styles.label} aria-live="polite">
        <span className={styles.key}>{current.key}</span> {current.name}
      </span>
      <Link className={styles.arrow} to={search(1)} replace aria-label="Next variant">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="m6 3 5 5-5 5" />
        </svg>
      </Link>
      <span className={styles.count}>
        {index + 1} of {variants.length}
      </span>
    </nav>
  );
}
