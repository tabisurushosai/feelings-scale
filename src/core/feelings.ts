export type FeelingLevelId = 1 | 2 | 3 | 4 | 5;

export interface FeelingLevel {
  id: FeelingLevelId;
  label: string;
  face: string;
  color: string;
  cards: string[];
}

export interface FeelingsState {
  selectedLevelId: FeelingLevelId;
}

export const feelingLevels: FeelingLevel[] = [
  {
    id: 1,
    label: "おちつき",
    face: "🙂",
    color: "#6bbf8a",
    cards: ["ゆっくり息をする", "このまま続ける", "できたことを1つ思い出す"],
  },
  {
    id: 2,
    label: "すこしモヤモヤ",
    face: "😐",
    color: "#88b7e8",
    cards: ["みずをのむ", "肩をゆっくり回す", "気持ちを短い言葉にする"],
  },
  {
    id: 3,
    label: "イライラ",
    face: "😟",
    color: "#f2c14e",
    cards: ["10まで数える", "静かな場所に移る", "手をぎゅっとして開く"],
  },
  {
    id: 4,
    label: "かなりイライラ",
    face: "😣",
    color: "#f28f3b",
    cards: ["大人に知らせる", "少しはなれる", "深呼吸を3回する"],
  },
  {
    id: 5,
    label: "ばくはつしそう",
    face: "😡",
    color: "#d94f45",
    cards: ["安全な場所へ行く", "助けてと言う", "落ち着くまで話さない"],
  },
];

export function createInitialFeelingsState(): FeelingsState {
  return { selectedLevelId: 1 };
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
