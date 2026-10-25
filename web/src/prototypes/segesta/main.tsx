import "@fontsource-variable/instrument-sans/wdth.css";
import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Horizon } from "./Horizon";
import { Specimen } from "./Specimen";
import { Relay } from "./Relay";
import "./base.css";
import "./Horizon.css";
import "./Specimen.css";
import "./Relay.css";
import "../picker.css";

const directions = [Horizon, Specimen, Relay];
const names = ["Horizon", "Specimen", "Relay"];
function readVariant() {
  const value = Number(new URLSearchParams(location.search).get("v"));
  return Number.isInteger(value) && value >= 1 && value <= 3 ? value - 1 : 0;
}
export function Picker() {
  const [current, setCurrent] = useState(readVariant);
  const [revision, setRevision] = useState(0);
  const nav = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const Variant = directions[current] ?? Horizon;
  useLayoutEffect(() => {
    const measure = () => {
      const item = items.current[current];
      if (!item || !highlight.current) return;
      highlight.current.style.width = `${String(item.offsetWidth)}px`;
      highlight.current.style.transform = `translateX(${String(item.offsetLeft)}px)`;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [current]);
  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set("v", String(current + 1));
    history.replaceState(null, "", url);
    document.title = `${names[current] ?? "Horizon"} · Drug Repurposing Explorer`;
    window.scrollTo({ top: 0, behavior: "instant" });
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
    const handle = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input,textarea,select,[contenteditable=true],[role=tablist]")
      )
        return;
      const number = Number(event.key);
      if (number >= 1 && number <= 3) {
        event.preventDefault();
        setCurrent(number - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrent((value) => (value + 1) % 3);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrent((value) => (value + 2) % 3);
      } else if (event.key.toLowerCase() === "r") setRevision((value) => value + 1);
    };
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("keydown", handle);
    };
  }, []);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="comparison-shelf" aria-hidden="true">
        <span>Website directions</span>
        <span>1–3 to compare · R to replay</span>
      </div>
      <div className="comparison-spacer" />
      <Variant key={`${String(current)}-${String(revision)}`} />
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
            }}
          >
            {name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button
          type="button"
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay website (R)"
          onClick={() => {
            setRevision((value) => value + 1);
          }}
        >
          ↻
        </button>
      </nav>
    </>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing prototype root");
createRoot(root).render(
  <StrictMode>
    <Picker />
  </StrictMode>,
);
