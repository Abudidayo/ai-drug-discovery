import { useSearchParams } from "react-router";

/* PROTOTYPE, throwaway: which `?variant=` a prototype page shows. See PrototypeSwitcher. */

export interface PrototypeVariant {
  key: string;
  name: string;
}

/** The variant named by `?variant=`; without one, the first, which is the default under review. */
export function usePrototypeVariant<V extends PrototypeVariant>(variants: readonly [V, ...V[]]): V {
  const [params] = useSearchParams();
  const key = params.get("variant");
  return variants.find((variant) => variant.key === key) ?? variants[0];
}
