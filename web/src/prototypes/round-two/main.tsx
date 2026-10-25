import "./base.css";
import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Folio } from "./Folio";
import { Orbit } from "./Orbit";
import { Assembly } from "./Assembly";
import "../picker.css";

const variants = [Folio, Orbit, Assembly];
const names = ["Folio", "Orbit", "Assembly"];
function initialVariant() {
  const value = Number(new URLSearchParams(window.location.search).get("v"));
  return Number.isInteger(value) && value >= 1 && value <= variants.length ? value - 1 : 0;
}

export function PrototypePicker() {
  const [current, setCurrent] = useState(initialVariant);
  const [replay, setReplay] = useState(0);
  const nav = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const Variant = variants[current] ?? Folio;

  useLayoutEffect(() => {
    const moveHighlight = () => {
      const item = items.current[current];
      if (!item || !highlight.current) return;
      highlight.current.style.width = `${String(item.offsetWidth)}px`;
      highlight.current.style.transform = `translateX(${String(item.offsetLeft)}px)`;
    };
    moveHighlight();
    window.addEventListener("resize", moveHighlight);
    return () => {
      window.removeEventListener("resize", moveHighlight);
    };
  }, [current]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(current + 1));
    window.history.replaceState(null, "", url);
    document.title = `${names[current] ?? "Folio"} · Drug repurposing explorer`;
  }, [current]);

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => nav.current?.setAttribute("data-ready", ""));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (number >= 1 && number <= variants.length) {
        event.preventDefault();
        setCurrent(number - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrent((value) => (value + 1) % variants.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrent((value) => (value - 1 + variants.length) % variants.length);
      } else if (event.key.toLowerCase() === "r") setReplay((value) => value + 1);
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Variant key={`${String(current)}-${String(replay)}`} />
      <nav className="proto-picker" data-position="top" aria-label="Prototype variants" ref={nav}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
        {names.map((name, index) => (
          <button
            type="button"
            key={name}
            ref={(node) => {
              items.current[index] = node;
            }}
            className="proto-picker-item"
            data-active={current === index ? "" : undefined}
            aria-current={current === index ? "true" : undefined}
            onClick={() => {
              setCurrent(index);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          >
            {name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button
          type="button"
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay animation (R)"
          onClick={() => {
            setReplay((value) => value + 1);
          }}
        >
          ↻
        </button>
      </nav>
    </>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Prototype root is missing");
createRoot(root).render(
  <StrictMode>
    <PrototypePicker />
  </StrictMode>,
);
