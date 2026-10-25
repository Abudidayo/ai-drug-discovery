import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Keynote } from "./round-three/Keynote";
import "./round-three/base.css";
import "./round-three/styles.css";

const url = new URL(window.location.href);
url.searchParams.delete("v");
window.history.replaceState(null, "", url);
document.title = "Half Life";

const root = document.getElementById("root");
if (!root) throw new Error("Half Life root is missing");
createRoot(root).render(
  <StrictMode>
    <a className="skip-link" href="#main-content">
      Skip to content
    </a>
    <Keynote />
  </StrictMode>,
);
