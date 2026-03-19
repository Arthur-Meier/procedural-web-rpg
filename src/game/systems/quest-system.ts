import { QUEST_COMPLETED_REFRESH_MS } from "../game-config.js";
import { createNextQuestState } from "../state/quest-factory.js";
import { renderQuestBoard } from "../ui/panels.js";
import type { QuestState } from "../app-types.js";
import type { Player } from "../types.js";

export interface QuestSystemHost {
  player: Player;
  quests: QuestState[];
  questBoardOpen: boolean;
  questBoardList: HTMLElement;
  setMessage(text: string, duration?: number): void;
  closeQuestBoard(): void;
}

export class QuestSystem {
  private lastQuestBoardRenderSecond = -1;

  constructor(private readonly host: QuestSystemHost) {}

  getActiveQuest(): QuestState | null {
    return this.host.quests.find((quest) => quest.accepted && !quest.completed) || null;
  }

  update(now = Date.now()): void {
    let hasCountdown = false;
    let questBoardChanged = false;

    for (let index = 0; index < this.host.quests.length; index += 1) {
      const quest = this.host.quests[index];
      if (!quest.completed || quest.refreshAt === null) {
        continue;
      }

      const remaining = quest.refreshAt - now;
      if (remaining <= 0) {
        this.host.quests[index] = createNextQuestState(quest);
        questBoardChanged = true;
        continue;
      }

      hasCountdown = true;
    }

    if (!this.host.questBoardOpen) {
      if (!hasCountdown) {
        this.lastQuestBoardRenderSecond = -1;
      }
      return;
    }

    const currentSecond = Math.floor(now / 1000);
    if (questBoardChanged || (hasCountdown && currentSecond !== this.lastQuestBoardRenderSecond)) {
      this.renderQuestBoard(now);
    }
  }

  acceptQuest(questId: string): void {
    const quest = this.host.quests.find((entry) => entry.id === questId);
    if (!quest || quest.completed) {
      return;
    }

    const activeQuest = this.getActiveQuest();
    if (activeQuest && activeQuest.id !== quest.id) {
      this.host.setMessage("Conclua sua missao atual antes de aceitar outra.", 2.6);
      return;
    }

    quest.accepted = true;
    this.host.setMessage(`Missao aceita: ${quest.title}`, 2.6);
    this.host.closeQuestBoard();
  }

  registerQuestKill(): void {
    const activeQuest = this.getActiveQuest();
    if (!activeQuest) {
      return;
    }

    activeQuest.progress = Math.min(activeQuest.killTarget, activeQuest.progress + 1);
    if (activeQuest.progress < activeQuest.killTarget) {
      return;
    }

    const completedAt = Date.now();
    activeQuest.completed = true;
    activeQuest.accepted = false;
    activeQuest.completedAt = completedAt;
    activeQuest.refreshAt = completedAt + QUEST_COMPLETED_REFRESH_MS;
    this.host.player.gold += activeQuest.rewardGold;
    this.host.setMessage(`Missao concluida! +${activeQuest.rewardGold} ouro`, 3);

    if (this.host.questBoardOpen) {
      this.renderQuestBoard(completedAt);
    }
  }

  renderQuestBoard(now = Date.now()): void {
    renderQuestBoard(this.host.questBoardList, this.host.quests, (questId) => this.acceptQuest(questId), now);
    this.lastQuestBoardRenderSecond = Math.floor(now / 1000);
  }
}
