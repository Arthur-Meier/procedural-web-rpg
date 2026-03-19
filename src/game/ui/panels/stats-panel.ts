import {
  computeMagicDamage,
  computeMoveSpeed,
  computePhysicalDamage,
  xpRequiredForNextLevel
} from "../../state-helpers.js";
import type { SpendStatPointHandler, StatsPanelRefs } from "../../app-types.js";
import type { Player, StatKey } from "../../types.js";

export function renderStatsPanel(
  refs: StatsPanelRefs,
  player: Player,
  onSpendStatPoint: SpendStatPointHandler
): void {
  const physicalDamage = computePhysicalDamage(player);
  const magicDamage = computeMagicDamage(player);
  const speed = computeMoveSpeed(player);
  const neededXp = xpRequiredForNextLevel(player.level);

  refs.statsOverview.innerHTML = `
      <div class="stat-pill"><span>Nivel</span><strong>${player.level}</strong></div>
      <div class="stat-pill"><span>XP</span><strong>${player.xp}/${neededXp}</strong></div>
      <div class="stat-pill"><span>Pontos Livres</span><strong>${player.unspentStatPoints}</strong></div>
      <div class="stat-pill"><span>Vida</span><strong>${player.hp}/${player.maxHp}</strong></div>
      <div class="stat-pill"><span>Dano Fisico</span><strong>${physicalDamage}</strong></div>
      <div class="stat-pill"><span>Dano Magico</span><strong>${magicDamage}</strong></div>
      <div class="stat-pill"><span>Velocidade</span><strong>${speed}</strong></div>
      <div class="stat-pill"><span>Ouro</span><strong>${player.gold}</strong></div>
    `;

  const statRows: { key: StatKey; label: string; description: string }[] = [
    {
      key: "strength",
      label: "Forca",
      description: "Aumenta o dano fisico em 10% do valor de forca mais a arma."
    },
    {
      key: "agility",
      label: "Agilidade",
      description: "A velocidade final e 50% do valor total de agilidade."
    },
    {
      key: "intelligence",
      label: "Inteligencia",
      description: "Aumenta o dano magico em 10% do valor de inteligencia mais a arma."
    },
    {
      key: "luck",
      label: "Sorte",
      description: "Melhora as chances gerais de drop."
    },
    {
      key: "constitution",
      label: "Constituicao",
      description: "Cada ponto vale 1 ponto direto de vida maxima."
    }
  ];

  refs.statsAllocation.replaceChildren();

  for (const row of statRows) {
    const statRow = document.createElement("article");
    statRow.className = "stat-row";

    const label = document.createElement("div");
    label.className = "stat-row-label";
    label.innerHTML = `<strong>${row.label}</strong><small>${row.description}</small>`;

    const value = document.createElement("div");
    value.className = "stat-row-value";
    value.textContent = String(player.stats[row.key]);

    const button = document.createElement("button");
    button.className = "stat-allocate-button";
    button.textContent = "+1";
    button.disabled = player.unspentStatPoints <= 0;
    button.addEventListener("click", () => onSpendStatPoint(row.key));

    statRow.append(label, value, button);
    refs.statsAllocation.append(statRow);
  }
}
