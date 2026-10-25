import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { api } from "./client";
import { ApiError, unwrap } from "./errors";
import type { Conformer, Experiment, ExperimentStatus } from "./types";

/** How long typing must pause before the disease search asks the API. */
export const SEARCH_DEBOUNCE_MS = 250;

/** How often a building Experiment is polled. */
export const BUILD_POLL_MS = 1000;

const SEARCH_LIMIT = 8;

export const queryKeys = {
  search: (query: string) => ["diseases", "search", query] as const,
  experiment: (id: string) => ["experiments", id] as const,
  conformer: (cid: number) => ["molecules", cid, "conformer"] as const,
};

/**
 * Diseases matching `query`, asked once typing pauses. Blank queries never reach the API. While
 * a new query loads, the previous results stay on screen so the list does not flicker.
 */
export function useDiseaseSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const result = useQuery({
    queryKey: queryKeys.search(debounced),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/api/diseases/search", {
          params: { query: { q: debounced, limit: SEARCH_LIMIT } },
          signal,
        }),
      ),
    enabled: debounced.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
  return { ...result, query: debounced, settled: debounced === query.trim() };
}

/** Starts building an Experiment for a Disease. The new Experiment is cached for its page. */
export function useCreateExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (diseaseId: string) =>
      unwrap(api.POST("/api/experiments", { body: { disease_id: diseaseId } })),
    onSuccess: (experiment) => {
      queryClient.setQueryData(queryKeys.experiment(experiment.id), experiment);
    },
  });
}

const BUILDING: readonly ExperimentStatus[] = ["queued", "building"];

export function isBuilding(experiment: Experiment): boolean {
  return BUILDING.includes(experiment.status);
}

/** One Experiment, polled every second while it is queued or building. */
export function useExperiment(id: string) {
  return useQuery({
    queryKey: queryKeys.experiment(id),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/api/experiments/{experiment_id}", {
          params: { path: { experiment_id: id } },
          signal,
        }),
      ),
    refetchInterval: (query) => {
      const experiment = query.state.data;
      return experiment !== undefined && isBuilding(experiment) ? BUILD_POLL_MS : false;
    },
  });
}

/**
 * The 3D conformer of a small molecule, or null when it has none: antibodies and other biologics
 * have no PubChem compound, and the API answers 404 for compounds without a 3D model.
 */
export function useConformer(pubchemCid: number | null) {
  return useQuery({
    queryKey: queryKeys.conformer(pubchemCid ?? 0),
    queryFn: async ({ signal }): Promise<Conformer | null> => {
      if (pubchemCid === null) return null;
      try {
        return await unwrap(
          api.GET("/api/molecules/{pubchem_cid}/conformer", {
            params: { path: { pubchem_cid: pubchemCid } },
            signal,
          }),
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: pubchemCid !== null,
    staleTime: Infinity,
  });
}
