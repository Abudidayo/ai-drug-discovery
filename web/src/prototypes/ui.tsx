import type { ReactNode } from "react";
import { demoNotice, researchNotice, tabs } from "./data";
import type { TabId } from "./data";
import type { IllustrationPlayback } from "./hooks";

export type IconName =
  | "arrow"
  | "play"
  | "pause"
  | "replay"
  | "download"
  | "search"
  | "check"
  | "network"
  | "layers"
  | "flask"
  | "external"
  | "chevron"
  | "close";

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M4 12h15M13 5l7 7-7 7" />
      </>
    ),
    play: <path d="m9 5 11 7-11 7Z" />,
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    replay: (
      <>
        <path d="M4 10a8 8 0 1 1 1.2 6M4 4v6h6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    check: <path d="m5 12 4.5 4.5L19 7" />,
    network: (
      <>
        <circle cx="5" cy="6" r="2.5" />
        <circle cx="19" cy="5" r="2.5" />
        <circle cx="12" cy="19" r="2.5" />
        <path d="m7.5 6 9-1M6 8l5 8M18 7.5l-5 9" />
      </>
    ),
    layers: (
      <>
        <path d="m3 7 9-5 9 5-9 5ZM3 12l9 5 9-5M3 17l9 5 9-5" />
      </>
    ),
    flask: (
      <>
        <path d="M9 3h6M10 3v7L4 20q0 1 2 1h12q2 0 2-1l-6-10V3M8 14h8" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7m0-7-11 11M10 4H4v16h16v-6" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand ${compact ? "brand-compact" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="m9 8 14 1 1 14-15 1L9 8Zm0 0 15 15M23 9 9 24"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="9" cy="8" r="4" fill="currentColor" />
          <circle cx="23" cy="9" r="3" fill="currentColor" />
          <circle cx="24" cy="23" r="4" fill="currentColor" />
          <circle cx="9" cy="24" r="3" fill="currentColor" />
        </svg>
      </span>
      <span>
        Drug repurposing<span className="brand-second">explorer</span>
      </span>
    </span>
  );
}

export function TabNav({
  active,
  onChange,
  vertical = false,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  vertical?: boolean;
}) {
  return (
    <nav
      className={`section-tabs ${vertical ? "section-tabs-vertical" : ""}`}
      aria-label="Explore the project"
    >
      {tabs.map((tab, index) => (
        <button
          type="button"
          key={tab.id}
          aria-current={active === tab.id ? "page" : undefined}
          onClick={() => {
            onChange(tab.id);
          }}
        >
          <span className="tab-symbol" aria-hidden="true">
            {vertical ? (
              <Icon name={index === 0 ? "network" : index === 1 ? "layers" : "flask"} />
            ) : null}
          </span>
          {tab.label}
          <span className="tab-indicator" />
        </button>
      ))}
    </nav>
  );
}

export function Button({
  children,
  onClick,
  secondary = false,
  icon = "arrow",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  icon?: IconName | false;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`action ${secondary ? "action-secondary" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      {icon && <Icon name={icon} />}
    </button>
  );
}

export function DemoBadge() {
  return (
    <span className="demo-badge">
      <span className="demo-dot" />
      Hackathon demo
    </span>
  );
}

export function IllustrationControls({ playback }: { playback: IllustrationPlayback }) {
  return (
    <button
      type="button"
      className="quiet-control illustration-control"
      onClick={playback.toggle}
      aria-pressed={playback.playing}
      disabled={playback.reduced}
      title={
        playback.reduced
          ? "Your device requests reduced motion. Workflow stages remain available manually."
          : undefined
      }
    >
      <Icon name={playback.playing ? "pause" : "play"} size={14} />
      {playback.reduced
        ? "Reduced motion"
        : playback.playing
          ? "Pause animation"
          : "Play animation"}
    </button>
  );
}

export function Footer() {
  return (
    <footer className="project-footer">
      <span>{researchNotice}</span>
      <span>Built for curious minds.</span>
    </footer>
  );
}

export function SampleNotice() {
  return (
    <div className="sample-notice">
      <span className="sample-mark" aria-hidden="true" />
      <span>{demoNotice}</span>
    </div>
  );
}
