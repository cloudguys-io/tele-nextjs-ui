"use client";
import { jsx } from "react/jsx-runtime";
import { Fragment, useSyncExternalStore } from "react";
import { formatTime } from "./messages.js";
const subscribe = () => () => {
};
function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
function LocalTime({ iso, lang }) {
  const hydrated = useHydrated();
  return /* @__PURE__ */ jsx("time", { dateTime: iso, children: hydrated ? formatTime(iso, lang) : null });
}
function formatNodes(template, vars) {
  const parts = template.split(/(\{\w+\})/);
  return parts.map((p, i) => {
    const name = /^\{(\w+)\}$/.exec(p)?.[1];
    return /* @__PURE__ */ jsx(Fragment, { children: name !== void 0 && name in vars ? vars[name] : p }, i);
  });
}
export {
  LocalTime,
  formatNodes,
  useHydrated
};
