import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Workflow } from "./round-three/Workflow";
import type { Tab } from "./round-three/model";
import "./round-three/base.css";

function go(tab: Tab) {
  const url = new URL("../", window.location.href);
  url.searchParams.set("tab", tab);
  window.location.assign(url);
}

const root = document.getElementById("root");
if (!root) throw new Error("Workflow root is missing");
createRoot(root).render(
  <StrictMode>
    <a className="skip-link" href="#workflow-content">
      Skip to workflow
    </a>
    <Workflow go={go} />
  </StrictMode>,
);
