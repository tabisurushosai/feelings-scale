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

export type FeelingLevelLabelMap = Record<FeelingLevelId, string>;

export interface FeelingsState {
  selectedLevelId: FeelingLevelId;
  careCardsByLevel: CareCardPresetMap;
  shouldKeepHistory: boolean;
  feelingHistory: FeelingHistoryEntry[];
  mode: FeelingsMode;
  parentPin: string | null;
  premium: PremiumState;
}

export interface FeelingsViewModel {
  levels: FeelingLevel[];
  selectedLevel: FeelingLevel;
  careCards: string[];
  shouldKeepHistory: boolean;
  feelingHistory: FeelingHistoryItem[];
  hasHistory: boolean;
  mode: FeelingsMode;
  hasParentPin: boolean;
  canEditCareCards: boolean;
  canUseHistory: boolean;
  premium: PremiumViewModel;
}

export const feelingsStateStorageKey = "feelingsState";
export const premiumTrialDays = 7;
export const stripeCheckoutUrl = "https://checkout.stripe.com/c/pay/feelings-scale-premium";

export type FeelingsMode = "child" | "parent";
export type PremiumStatus = "free" | "trial" | "premium";

export interface FeelingHistoryEntry {
  levelId: FeelingLevelId;
  selectedAt: string;
}

export interface FeelingHistoryItem extends FeelingHistoryEntry {
  level: FeelingLevel;
}

export interface PremiumState {
  status: PremiumStatus;
  trialStartedAt: string | null;
  purchasedAt: string | null;
}

export interface PremiumViewModel {
  status: PremiumStatus;
  isActive: boolean;
  isTrialAvailable: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  checkoutUrl: string;
}

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

export function createInitialFeelingsState(
  defaultCareCardsByLevel: CareCardPresetMap = createDefaultCareCardsByLevel(),
): FeelingsState {
  return {
    selectedLevelId: 1,
    careCardsByLevel: cloneCareCardsByLevel(defaultCareCardsByLevel),
    shouldKeepHistory: false,
    feelingHistory: [],
    mode: "child",
    parentPin: null,
    premium: createInitialPremiumState(),
  };
}

export function isFeelingLevelId(value: unknown): value is FeelingLevelId {
  return (
    typeof value === "number" &&
    feelingLevels.some((level) => level.id === value)
  );
}

export function getNextFeelingLevelId(
  currentLevelId: FeelingLevelId,
  direction: -1 | 1,
): FeelingLevelId {
  const currentIndex = feelingLevels.findIndex((level) => level.id === currentLevelId);
  const nextIndex = Math.min(
    feelingLevels.length - 1,
    Math.max(0, currentIndex + direction),
  );

  return feelingLevels[nextIndex]?.id ?? feelingLevels[0].id;
}

export function getBoundaryFeelingLevelId(boundary: "first" | "last"): FeelingLevelId {
  return boundary === "first"
    ? feelingLevels[0].id
    : feelingLevels[feelingLevels.length - 1].id;
}

export function normalizeFeelingsState(
  value: unknown,
  defaultCareCardsByLevel: CareCardPresetMap = createDefaultCareCardsByLevel(),
): FeelingsState {
  const initialState = createInitialFeelingsState(defaultCareCardsByLevel);

  if (!isRecord(value)) return initialState;

  return {
    selectedLevelId: isFeelingLevelId(value.selectedLevelId)
      ? value.selectedLevelId
      : initialState.selectedLevelId,
    careCardsByLevel: normalizeCareCardsByLevel(value, defaultCareCardsByLevel),
    shouldKeepHistory:
      typeof value.shouldKeepHistory === "boolean"
        ? value.shouldKeepHistory
        : initialState.shouldKeepHistory,
    feelingHistory: normalizeFeelingHistory(value),
    mode: normalizeFeelingsMode(value),
    parentPin: normalizeParentPin(value),
    premium: normalizePremiumState(value),
  };
}

export function selectFeelingLevel(
  state: FeelingsState,
  selectedLevelId: FeelingLevelId,
): FeelingsState {
  return { ...state, selectedLevelId };
}

export function recordFeelingSelection(
  state: FeelingsState,
  selectedLevelId: FeelingLevelId,
  selectedAt: string,
): FeelingsState {
  const nextState = selectFeelingLevel(state, selectedLevelId);
  if (
    !state.shouldKeepHistory ||
    !isValidIsoDateTime(selectedAt) ||
    !isPremiumActiveAt(state.premium, selectedAt)
  ) {
    return nextState;
  }

  return {
    ...nextState,
    feelingHistory: [...state.feelingHistory, { levelId: selectedLevelId, selectedAt }],
  };
}

export function setFeelingHistoryRetention(
  state: FeelingsState,
  shouldKeepHistory: boolean,
  currentAt: string,
): FeelingsState {
  if (shouldKeepHistory && !isPremiumActiveAt(state.premium, currentAt)) return state;
  return { ...state, shouldKeepHistory };
}

export function clearFeelingHistory(state: FeelingsState): FeelingsState {
  return { ...state, feelingHistory: [] };
}

export function setParentPin(state: FeelingsState, parentPin: string): FeelingsState {
  const normalizedPin = normalizePinInput(parentPin);
  if (!isValidParentPin(normalizedPin)) return state;

  return {
    ...state,
    parentPin: normalizedPin,
    mode: "parent",
  };
}

export function enterParentMode(state: FeelingsState, parentPin: string): FeelingsState {
  if (!state.parentPin) return setParentPin(state, parentPin);
  if (normalizePinInput(parentPin) !== state.parentPin) return state;

  return {
    ...state,
    mode: "parent",
  };
}

export function enterChildMode(state: FeelingsState): FeelingsState {
  return {
    ...state,
    mode: "child",
  };
}

export function isValidParentPin(parentPin: string): boolean {
  return /^\d{4}$/.test(parentPin);
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

export function restoreCareCard(
  state: FeelingsState,
  levelId: FeelingLevelId,
  cardIndex: number,
  cardText: string,
): FeelingsState {
  const normalizedText = cardText.trim();
  const careCards = state.careCardsByLevel[levelId];

  if (!normalizedText || !Number.isInteger(cardIndex)) {
    return state;
  }

  const insertIndex = Math.min(Math.max(cardIndex, 0), careCards.length);

  return {
    ...state,
    careCardsByLevel: {
      ...state.careCardsByLevel,
      [levelId]: [
        ...careCards.slice(0, insertIndex),
        normalizedText,
        ...careCards.slice(insertIndex),
      ],
    },
  };
}

export function startPremiumTrial(
  state: FeelingsState,
  startedAt: string,
): FeelingsState {
  if (!isValidIsoDateTime(startedAt) || state.premium.status !== "free") return state;

  return {
    ...state,
    premium: {
      status: "trial",
      trialStartedAt: startedAt,
      purchasedAt: null,
    },
  };
}

export function markPremiumPurchased(
  state: FeelingsState,
  purchasedAt: string,
): FeelingsState {
  if (!isValidIsoDateTime(purchasedAt)) return state;

  return {
    ...state,
    premium: {
      status: "premium",
      trialStartedAt: state.premium.trialStartedAt,
      purchasedAt,
    },
  };
}

export function getSelectedFeelingLevel(
  state: FeelingsState,
  levelLabels?: FeelingLevelLabelMap,
): FeelingLevel {
  const selectedLevel = getLocalizedFeelingLevels(levelLabels).find((level) => level.id === state.selectedLevelId);
  return selectedLevel ?? getLocalizedFeelingLevels(levelLabels)[0];
}

export function createFeelingsViewModel(
  state: FeelingsState,
  levelLabels?: FeelingLevelLabelMap,
  currentAt = "",
): FeelingsViewModel {
  const levels = getLocalizedFeelingLevels(levelLabels);
  const selectedLevel = getSelectedFeelingLevel(state, levelLabels);
  const premium = createPremiumViewModel(state.premium, currentAt);
  const feelingHistory = state.feelingHistory.map<FeelingHistoryItem>((entry) => ({
    ...entry,
    level: levels.find((level) => level.id === entry.levelId) ?? levels[0],
  }));

  return {
    levels,
    selectedLevel,
    careCards: state.careCardsByLevel[selectedLevel.id],
    shouldKeepHistory: state.shouldKeepHistory,
    feelingHistory,
    hasHistory: feelingHistory.length > 0,
    mode: state.mode,
    hasParentPin: state.parentPin !== null,
    canEditCareCards: state.mode === "parent" && premium.isActive,
    canUseHistory: premium.isActive,
    premium,
  };
}

export function createPremiumViewModel(
  premium: PremiumState,
  currentAt: string,
): PremiumViewModel {
  const isTrialActive = isPremiumTrialActiveAt(premium, currentAt);

  return {
    status: premium.status,
    isActive: premium.status === "premium" || isTrialActive,
    isTrialAvailable: premium.status === "free",
    isTrialActive,
    trialDaysRemaining: getPremiumTrialDaysRemaining(premium, currentAt),
    checkoutUrl: stripeCheckoutUrl,
  };
}

function createInitialPremiumState(): PremiumState {
  return {
    status: "free",
    trialStartedAt: null,
    purchasedAt: null,
  };
}

function normalizeFeelingsMode(value: Record<string, unknown>): FeelingsMode {
  return value.mode === "parent" || value.mode === "child" ? value.mode : "child";
}

function normalizeParentPin(value: Record<string, unknown>): string | null {
  if (typeof value.parentPin !== "string") return null;

  const normalizedPin = normalizePinInput(value.parentPin);
  return isValidParentPin(normalizedPin) ? normalizedPin : null;
}

function normalizePremiumState(value: Record<string, unknown>): PremiumState {
  if (!isRecord(value.premium)) {
    return createInitialPremiumState();
  }

  const premium = value.premium;
  const status = normalizePremiumStatus(premium.status);
  const trialStartedAt = typeof premium.trialStartedAt === "string" && isValidIsoDateTime(premium.trialStartedAt)
    ? premium.trialStartedAt
    : null;
  const purchasedAt = typeof premium.purchasedAt === "string" && isValidIsoDateTime(premium.purchasedAt)
    ? premium.purchasedAt
    : null;

  if (status === "premium") {
    return {
      status,
      trialStartedAt,
      purchasedAt,
    };
  }

  if (status === "trial" && trialStartedAt) {
    return {
      status,
      trialStartedAt,
      purchasedAt: null,
    };
  }

  return createInitialPremiumState();
}

function normalizePremiumStatus(value: unknown): PremiumStatus {
  if (value === "trial" || value === "premium") return value;
  return "free";
}

function normalizePinInput(value: string): string {
  return value.trim();
}

function normalizeCareCardsByLevel(
  value: Record<string, unknown>,
  defaultCareCardsByLevel: CareCardPresetMap,
): CareCardPresetMap {
  const defaults = cloneCareCardsByLevel(defaultCareCardsByLevel);
  if (!isRecord(value.careCardsByLevel)) {
    return defaults;
  }

  const savedCareCardsByLevel = value.careCardsByLevel;
  return feelingLevels.reduce<CareCardPresetMap>((careCardsByLevel, level) => {
    const savedCards = savedCareCardsByLevel[String(level.id)];
    careCardsByLevel[level.id] = normalizeCareCardList(savedCards, defaultCareCardsByLevel[level.id] ?? getCareCardPresets(level.id));
    return careCardsByLevel;
  }, defaults);
}

function getLocalizedFeelingLevels(levelLabels?: FeelingLevelLabelMap): FeelingLevel[] {
  if (!levelLabels) return feelingLevels;

  return feelingLevels.map((level) => ({
    ...level,
    label: levelLabels[level.id],
  }));
}

function cloneCareCardsByLevel(careCardsByLevel: CareCardPresetMap): CareCardPresetMap {
  return {
    1: [...careCardsByLevel[1]],
    2: [...careCardsByLevel[2]],
    3: [...careCardsByLevel[3]],
    4: [...careCardsByLevel[4]],
    5: [...careCardsByLevel[5]],
  };
}

function normalizeCareCardList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];

  const careCards = value
    .filter((cardText): cardText is string => typeof cardText === "string")
    .map((cardText) => cardText.trim())
    .filter((cardText) => cardText.length > 0);

  return careCards.length > 0 ? careCards : [...fallback];
}

function normalizeFeelingHistory(value: Record<string, unknown>): FeelingHistoryEntry[] {
  if (!Array.isArray(value.feelingHistory)) return [];

  return value.feelingHistory.filter((entry): entry is FeelingHistoryEntry => {
    if (typeof entry !== "object" || entry === null) return false;
    if (!("levelId" in entry) || !isFeelingLevelId(entry.levelId)) return false;
    return "selectedAt" in entry && typeof entry.selectedAt === "string" && isValidIsoDateTime(entry.selectedAt);
  });
}

function isValidIsoDateTime(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function isPremiumActiveAt(premium: PremiumState, currentAt: string): boolean {
  return premium.status === "premium" || isPremiumTrialActiveAt(premium, currentAt);
}

function isPremiumTrialActiveAt(premium: PremiumState, currentAt: string): boolean {
  if (premium.status !== "trial" || !premium.trialStartedAt) return false;
  if (!isValidIsoDateTime(currentAt)) return false;

  const startedAtTime = Date.parse(premium.trialStartedAt);
  const currentTime = Date.parse(currentAt);
  const trialEndsAt = startedAtTime + premiumTrialDays * 24 * 60 * 60 * 1000;
  return currentTime >= startedAtTime && currentTime < trialEndsAt;
}

function getPremiumTrialDaysRemaining(premium: PremiumState, currentAt: string): number {
  if (!isPremiumTrialActiveAt(premium, currentAt) || !premium.trialStartedAt) return 0;

  const trialEndsAt = Date.parse(premium.trialStartedAt) + premiumTrialDays * 24 * 60 * 60 * 1000;
  const remainingMilliseconds = trialEndsAt - Date.parse(currentAt);
  return Math.max(0, Math.ceil(remainingMilliseconds / (24 * 60 * 60 * 1000)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
