export type OverlayPanel = "none" | "map" | "stats" | "inventory" | "quests";

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  killTarget: number;
  rewardGold: number;
}

export interface QuestState {
  id: string;
  templateId: string;
  rotation: number;
  title: string;
  description: string;
  killTarget: number;
  rewardGold: number;
  progress: number;
  accepted: boolean;
  completed: boolean;
  completedAt: number | null;
  refreshAt: number | null;
}
