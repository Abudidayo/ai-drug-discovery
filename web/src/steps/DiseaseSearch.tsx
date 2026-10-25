import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useCreateExperiment, useDiseaseSearch } from "../api/queries";
import type { DiseaseSearchResult, Experiment } from "../api/types";
import { Panel } from "../app/Figure";
import { stepPath } from "../app/steps";
import { copy } from "../copy/en";
import styles from "./DiseaseSearch.module.css";

/**
 * Underlines the part of `text` that matches the query, case-insensitively. A whole-text match
 * stays plain: underlining all of it would only make it look like a link.
 */
function marked(text: string, query: string): ReactNode {
  const at = query === "" ? -1 : text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0 || query.length === text.length) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

interface DiseaseSearchProps {
  /** The Experiment on screen, if any: its Disease is pre-filled and marked as current. */
  current?: Experiment | undefined;
}

/**
 * Step 1: search Diseases and choose one. Choosing creates an Experiment and moves on to its
 * biology, where the build progress shows. Choosing the current Experiment's Disease again just
 * moves on.
 */
export function DiseaseSearch({ current }: DiseaseSearchProps) {
  const [query, setQuery] = useState(current?.disease.name ?? "");
  const search = useDiseaseSearch(query);
  const create = useCreateExperiment();
  const navigate = useNavigate();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const blank = query.trim() === "";
  const results = blank ? [] : (search.data?.results ?? []);

  const choose = (result: DiseaseSearchResult) => {
    if (current?.disease.id === result.id) {
      void navigate(stepPath(current.id, "biology") ?? "/");
      return;
    }
    create.mutate(result.id, {
      onSuccess: (experiment) => {
        void navigate(stepPath(experiment.id, "biology") ?? "/");
      },
    });
  };

  const options = () => [...(listRef.current?.querySelectorAll("button") ?? [])];

  const onInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const first = results[0];
    if (event.key === "Enter" && first !== undefined) {
      event.preventDefault();
      choose(first);
    } else if (event.key === "ArrowDown" && first !== undefined) {
      event.preventDefault();
      options()[0]?.focus();
    }
  };

  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = options();
    const at = buttons.findIndex((button) => button === document.activeElement);
    const next = at + (event.key === "ArrowDown" ? 1 : -1);
    if (next < 0) listRef.current?.parentElement?.querySelector("input")?.focus();
    else buttons[Math.min(next, buttons.length - 1)]?.focus();
  };

  let status: ReactNode = null;
  if (create.isError) {
    const retryId = create.variables;
    status = (
      <>
        <p>{copy.search.createFailed}</p>
        <button
          type="button"
          className={styles.retry}
          onClick={() => {
            const retry = results.find((result) => result.id === retryId);
            if (retry) choose(retry);
          }}
        >
          {copy.retry}
        </button>
      </>
    );
  } else if (!blank && search.isError && search.data === undefined) {
    status = (
      <>
        <p>{copy.search.unavailable}</p>
        <button type="button" className={styles.retry} onClick={() => void search.refetch()}>
          {copy.retry}
        </button>
      </>
    );
  } else if (!blank && search.settled && search.isSuccess && results.length === 0) {
    status = <p>{copy.search.noMatch(query.trim())}</p>;
  }

  return (
    <Panel area="search" label={copy.search.placeholder}>
      <div className={styles.search}>
        <input
          type="search"
          className={styles.input}
          value={query}
          placeholder={copy.search.placeholder}
          aria-label={copy.search.placeholder}
          aria-controls={listId}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value);
            if (create.isError) create.reset();
          }}
          onKeyDown={onInputKey}
        />
        {/* Arrow keys move between results; handled on the list, as the buttons inside it. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <ul id={listId} ref={listRef} className={styles.results} onKeyDown={onListKey}>
          {results.map((result) => {
            const isCurrent = current?.disease.id === result.id;
            const busy = create.isPending && create.variables === result.id;
            return (
              <li key={result.id}>
                <button
                  type="button"
                  className={styles.option}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-busy={busy || undefined}
                  disabled={create.isPending}
                  onClick={() => {
                    choose(result);
                  }}
                >
                  <span className={styles.name}>{marked(result.name, query.trim())}</span>
                  <span className={styles.id}>{result.id}</span>
                  {result.matched_synonym !== null && (
                    <span className={styles.synonym}>
                      {marked(result.matched_synonym, query.trim())}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {status !== null && (
          <div className={styles.status} role="status">
            {status}
          </div>
        )}
      </div>
    </Panel>
  );
}
