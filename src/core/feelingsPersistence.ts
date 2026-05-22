import type { Store } from "../storage";
import type { CareCardPresetMap } from "./careCards";
import {
  type FeelingsState,
  feelingsStateStorageKey,
  normalizeFeelingsState,
} from "./feelings";

export async function loadFeelingsState(
  store: Store,
  defaultCareCardsByLevel?: CareCardPresetMap,
): Promise<FeelingsState> {
  const savedState = await store.get<unknown>(feelingsStateStorageKey);
  return normalizeFeelingsState(savedState, defaultCareCardsByLevel);
}

export function saveFeelingsState(
  store: Store,
  state: FeelingsState,
): Promise<void> {
  return store.set(feelingsStateStorageKey, state);
}

export function removeFeelingsState(store: Store): Promise<void> {
  return store.remove(feelingsStateStorageKey);
}
