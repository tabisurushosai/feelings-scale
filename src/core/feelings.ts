import { getCareCardPresets } from "./careCards";

export type FeelingLevelId = 1 | 2 | 3 | 4 | 5;

export interface FeelingLevel {
  id: FeelingLevelId;
  label: string;
  face: string;
  color: string;
}

export interface FeelingsState {
  selectedLevelId: FeelingLevelId;
}

export interface FeelingsViewModel {
  levels: FeelingLevel[];
  selectedLevel: FeelingLevel;
  careCards: string[];
}

export const feelingsStateStorageKey = "feelingsState";

export const feelingLevels: FeelingLevel[] = [
  {
    id: 1,
    label: "おちつき",
    face: "🙂",
    color: "#6bbf8a",
  },
  {
    id: 2,
    label: "すこしモヤモヤ",
    face: "😐",
    color: "#88b7e8",
  },
  {
    id: 3,
    label: "イライラ",
    face: "😟",
    color: "#f2c14e",
  },
  {
    id: 4,
    label: "かなりイライラ",
    face: "😣",
    color: "#f28f3b",
  },
  {
    id: 5,
    label: "ばくはつしそう",
    face: "😡",
    color: "#d94f45",
  },
];

export function createInitialFeelingsState(): FeelingsState {
  return { selectedLevelId: 1 };
}

export function isFeelingLevelId(value: unknown): value is FeelingLevelId {
  return (
    typeof value === "number" &&
    feelingLevels.some((level) => level.id === value)
  );
}

export function normalizeFeelingsState(value: unknown): FeelingsState {
  if (
    typeof value === "object" &&
    value !== null &&
    "selectedLevelId" in value &&
    isFeelingLevelId(value.selectedLevelId)
  ) {
    return { selectedLevelId: value.selectedLevelId };
  }

  return createInitialFeelingsState();
}

export function selectFeelingLevel(
  state: FeelingsState,
  selectedLevelId: FeelingLevelId,
): FeelingsState {
  return { ...state, selectedLevelId };
}

export function getSelectedFeelingLevel(state: FeelingsState): FeelingLevel {
  const selectedLevel = feelingLevels.find((level) => level.id === state.selectedLevelId);
  return selectedLevel ?? feelingLevels[0];
}

export function createFeelingsViewModel(state: FeelingsState): FeelingsViewModel {
  const selectedLevel = getSelectedFeelingLevel(state);

  return {
    levels: feelingLevels,
    selectedLevel,
    careCards: getCareCardPresets(selectedLevel.id),
  };
}
