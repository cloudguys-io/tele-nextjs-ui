"use client";
// Times in the reader's own time zone. The server doesn't know it, so the server render and hydration leave
// the <time> empty, and the text appears right after hydration. No hydration mismatch, no wrong zone.
import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import { formatTime } from "./messages.js";

const subscribe = () => () => {};

/** False on the server and while hydrating, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function LocalTime({ iso, lang }: { iso: string; lang?: string }) {
  const hydrated = useHydrated();
  return <time dateTime={iso}>{hydrated ? formatTime(iso, lang) : null}</time>;
}

/** Like format(), but placeholders can be React nodes. */
export function formatNodes(template: string, vars: Record<string, ReactNode>): ReactNode {
  const parts = template.split(/(\{\w+\})/);
  return parts.map((p, i) => {
    const name = /^\{(\w+)\}$/.exec(p)?.[1];
    return <Fragment key={i}>{name !== undefined && name in vars ? vars[name] : p}</Fragment>;
  });
}
