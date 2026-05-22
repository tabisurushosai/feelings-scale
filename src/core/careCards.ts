import type { FeelingLevelId } from "./feelings";

export type CareCardPresetMap = Record<FeelingLevelId, string[]>;

export const careCardPresetsByLevel: CareCardPresetMap = {
  1: ["ゆっくり息をする", "このまま続ける", "できたことを1つ思い出す"],
  2: ["みずをのむ", "肩をゆっくり回す", "気持ちを短い言葉にする"],
  3: ["10まで数える", "静かな場所に移る", "手をぎゅっとして開く"],
  4: ["大人に知らせる", "少しはなれる", "深呼吸を3回する"],
  5: ["安全な場所へ行く", "助けてと言う", "落ち着くまで話さない"],
};

export function getCareCardPresets(levelId: FeelingLevelId): string[] {
  return careCardPresetsByLevel[levelId];
}
