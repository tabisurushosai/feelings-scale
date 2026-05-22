import {
  type CareCardPresetMap,
  createDefaultCareCardsByLevel,
  getCareCardPresets,
} from "./careCards";

export type FeelingLevelId = 1 | 2 | 3 | 4 | 5;

export interface FeelingLevel {
  id: FeelingLevelId;
  label: string;
  face: string;
  color: string;
}

export interface FeelingsState {
  selectedLevelId: FeelingLevelId;
  careCardsByLevel: CareCardPresetMap;
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
  return {
    selectedLevelId: 1,
    careCardsByLevel: createDefaultCareCardsByLevel(),
  };
}

export function isFeelingLevelId(value: unknown): value is FeelingLevelId {
  return (
    typeof value === "number" &&
    feelingLevels.some((level) => level.id === value)
  );
}

export function normalizeFeelingsState(value: unknown): FeelingsState {
  const initialState = createInitialFeelingsState();

  if (
    typeof value === "object" &&
    value !== null &&
    "selectedLevelId" in value &&
    isFeelingLevelId(value.selectedLevelId)
  ) {
    return {
      selectedLevelId: value.selectedLevelId,
      careCardsByLevel: normalizeCareCardsByLevel(value),
    };
  }

  return initialState;
}

export function selectFeelingLevel(
  state: FeelingsState,
  selectedLevelId: FeelingLevelId,
): FeelingsState {
  return { ...state, selectedLevelId };
}

export function addCareCard(
  state: FeelingsState,
  levelId: FeelingLevelId,
  cardText: string,
): FeelingsState {
  const normalizedText = cardText.trim();
  if (!normalizedText) return state;

  return {
    ...state,
    careCardsByLevel: {
      ...state.careCardsByLevel,
      [levelId]: [...state.careCardsByLevel[levelId], normalizedText],
    },
  };
}

export function updateCareCard(
  state: FeelingsState,
  levelId: FeelingLevelId,
  cardIndex: number,
  cardText: string,
): FeelingsState {
  const normalizedText = cardText.trim();
  const careCards = state.careCardsByLevel[levelId];

  if (!normalizedText || !Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= careCards.length) {
    return state;
  }

  return {
    ...state,
    careCardsByLevel: {
      ...state.careCardsByLevel,
      [levelId]: careCards.map((careCard, index) => (index === cardIndex ? normalizedText : careCard)),
    },
  };
}

export function removeCareCard(
  state: FeelingsState,
  levelId: FeelingLevelId,
  cardIndex: number,
): FeelingsState {
  const careCards = state.careCardsByLevel[levelId];

  if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= careCards.length) {
    return state;
  }

  return {
    ...state,
    careCardsByLevel: {
      ...state.careCardsByLevel,
      [levelId]: careCards.filter((_, index) => index !== cardIndex),
    },
  };
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
    careCards: state.careCardsByLevel[selectedLevel.id],
  };
}

function normalizeCareCardsByLevel(value: object): CareCardPresetMap {
  const defaults = createDefaultCareCardsByLevel();

  if (!("careCardsByLevel" in value) || typeof value.careCardsByLevel !== "object" || value.careCardsByLevel === null) {
    return defaults;
  }

  return feelingLevels.reduce<CareCardPresetMap>((careCardsByLevel, level) => {
    const savedCards = (value.careCardsByLevel as Record<string, unknown>)[String(level.id)];
    careCardsByLevel[level.id] = normalizeCareCardList(savedCards, getCareCardPresets(level.id));
    return careCardsByLevel;
  }, defaults);
}

function normalizeCareCardList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];

  const careCards = value
    .filter((cardText): cardText is string => typeof cardText === "string")
    .map((cardText) => cardText.trim())
    .filter((cardText) => cardText.length > 0);

  return careCards.length > 0 ? careCards : [...fallback];
}
