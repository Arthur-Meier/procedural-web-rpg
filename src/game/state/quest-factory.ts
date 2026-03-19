import { QUEST_BOARD_TEMPLATE, QUEST_COMPLETED_REFRESH_MS } from "../game-config.js";
import type { QuestState } from "../app-types.js";

function normalizeTemplateIndex(index: number): number {
  const templateCount = QUEST_BOARD_TEMPLATE.length;
  return ((index % templateCount) + templateCount) % templateCount;
}

function resolveTemplateIndex(templateId: string | undefined, fallbackIndex: number): number {
  const resolvedIndex = QUEST_BOARD_TEMPLATE.findIndex((template) => template.id === templateId);
  return resolvedIndex >= 0 ? resolvedIndex : normalizeTemplateIndex(fallbackIndex);
}

function toRomanNumeral(value: number): string {
  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
  ];

  let remaining = Math.max(1, Math.floor(value));
  let result = "";

  for (const [amount, symbol] of numerals) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  }

  return result;
}

function createQuestState(templateIndex: number, rotation: number): QuestState {
  const template = QUEST_BOARD_TEMPLATE[normalizeTemplateIndex(templateIndex)];
  const normalizedRotation = Math.max(0, Math.floor(rotation));
  const targetBonus = normalizedRotation === 0 ? 0 : Math.max(1, Math.ceil(template.killTarget * 0.35 * normalizedRotation));
  const killTarget = template.killTarget + targetBonus;
  const rewardGold = Math.round(template.rewardGold * (1 + normalizedRotation * 0.2)) + targetBonus * 2;
  const titleSuffix = normalizedRotation === 0 ? "" : ` ${toRomanNumeral(normalizedRotation + 1)}`;
  const descriptionSuffix =
    normalizedRotation === 0 ? "" : " Uma nova leva de criaturas apareceu e precisa ser contida.";

  return {
    id: `${template.id}-${normalizedRotation + 1}`,
    templateId: template.id,
    rotation: normalizedRotation,
    title: `${template.title}${titleSuffix}`,
    description: `${template.description}${descriptionSuffix}`,
    killTarget,
    rewardGold,
    progress: 0,
    accepted: false,
    completed: false,
    completedAt: null,
    refreshAt: null
  };
}

export function createQuestBoardState(): QuestState[] {
  return QUEST_BOARD_TEMPLATE.map((_, index) => createQuestState(index, 0));
}

export function createNextQuestState(previousQuest: QuestState): QuestState {
  return createQuestState(resolveTemplateIndex(previousQuest.templateId, 0), previousQuest.rotation + 1);
}

export function hydrateQuestBoardState(quests: QuestState[] | null | undefined, now = Date.now()): QuestState[] {
  if (!Array.isArray(quests) || quests.length === 0) {
    return createQuestBoardState();
  }

  return quests.map((quest, index) => {
    const baseQuest = createQuestState(resolveTemplateIndex(quest?.templateId, index), quest?.rotation ?? 0);
    const completed = Boolean(quest?.completed);
    const killTarget = typeof quest?.killTarget === "number" && quest.killTarget > 0 ? quest.killTarget : baseQuest.killTarget;
    const progress = typeof quest?.progress === "number" ? Math.max(0, Math.min(killTarget, Math.floor(quest.progress))) : 0;
    const completedAt =
      completed && typeof quest?.completedAt === "number" ? quest.completedAt :
      completed ? now : null;
    const refreshAt =
      completed && typeof quest?.refreshAt === "number" ? quest.refreshAt :
      completed && completedAt !== null ? completedAt + QUEST_COMPLETED_REFRESH_MS : null;

    return {
      ...baseQuest,
      id: typeof quest?.id === "string" && quest.id ? quest.id : baseQuest.id,
      templateId: typeof quest?.templateId === "string" && quest.templateId ? quest.templateId : baseQuest.templateId,
      rotation: typeof quest?.rotation === "number" ? Math.max(0, Math.floor(quest.rotation)) : baseQuest.rotation,
      title: typeof quest?.title === "string" && quest.title ? quest.title : baseQuest.title,
      description: typeof quest?.description === "string" && quest.description ? quest.description : baseQuest.description,
      killTarget,
      rewardGold: typeof quest?.rewardGold === "number" && quest.rewardGold > 0 ? Math.floor(quest.rewardGold) : baseQuest.rewardGold,
      progress,
      accepted: completed ? false : Boolean(quest?.accepted),
      completed,
      completedAt,
      refreshAt
    };
  });
}

export function getQuestRefreshRemaining(quest: QuestState, now = Date.now()): number {
  if (!quest.completed || quest.refreshAt === null) {
    return 0;
  }

  return Math.max(0, quest.refreshAt - now);
}
