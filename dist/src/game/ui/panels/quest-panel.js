import { getQuestRefreshRemaining } from "../../state/quest-factory.js";
function formatCountdown(totalMilliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(totalMilliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
export function renderQuestBoard(questBoardList, quests, onAcceptQuest, now = Date.now()) {
    questBoardList.replaceChildren();
    const activeQuest = quests.find((quest) => quest.accepted && !quest.completed) || null;
    for (const quest of quests) {
        const card = document.createElement("article");
        card.className = `quest-card${quest.completed ? " completed" : quest.accepted ? " active" : ""}`;
        const title = document.createElement("strong");
        title.textContent = quest.title;
        const description = document.createElement("small");
        description.textContent = `${quest.description} (${quest.progress}/${quest.killTarget})`;
        const reward = document.createElement("small");
        reward.className = "quest-reward";
        reward.textContent = `Recompensa: ${quest.rewardGold} ouro`;
        const status = document.createElement("small");
        status.className = "quest-timer";
        const button = document.createElement("button");
        if (quest.completed) {
            status.textContent = `Nova missao em ${formatCountdown(getQuestRefreshRemaining(quest, now))}`;
            button.textContent = "Concluida";
            button.disabled = true;
        }
        else if (quest.accepted) {
            status.textContent = "Missao em andamento";
            button.textContent = "Em andamento";
            button.disabled = true;
        }
        else {
            status.textContent = activeQuest ? "Aguardando a missao ativa terminar" : "Disponivel para aceitar";
            button.textContent = activeQuest ? "Indisponivel" : "Aceitar";
            button.disabled = Boolean(activeQuest);
            button.addEventListener("click", () => onAcceptQuest(quest.id));
        }
        card.append(title, description, reward, status, button);
        questBoardList.append(card);
    }
}
