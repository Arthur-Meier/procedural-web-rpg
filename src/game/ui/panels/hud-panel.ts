import { xpRequiredForNextLevel } from "../../state-helpers.js";
import type { HudRefs, QuestState } from "../../app-types.js";
import type { EnemyEntity, Player } from "../../types.js";

export function updateHud(
  refs: HudRefs,
  player: Player,
  _enemies: EnemyEntity[],
  message: string,
  nearGuideNpc: boolean,
  activeQuest: QuestState | null,
  dayCount: number
): void {
  const neededXp = xpRequiredForNextLevel(player.level);
  const hpRatio = Math.max(0, Math.min(100, player.maxHp ? player.hp / player.maxHp * 100 : 0));
  const xpRatio = Math.max(0, Math.min(100, player.xp / neededXp * 100));
  const occupied = player.inventory.filter(Boolean).length;

  refs.hudTop.innerHTML = `
    <div class="hud-level" aria-label="Nível ${player.level}"><span class="ui-glyph glyph-crest" aria-hidden="true"></span><strong>${player.level}</strong></div>
    <div class="hud-vitals">
      <div class="hud-vital-label"><span>Vida</span><strong>${player.hp}<span> / ${player.maxHp}</span></strong></div>
      <div class="bar health-bar" role="progressbar" aria-label="Vida" aria-valuemin="0" aria-valuemax="${player.maxHp}" aria-valuenow="${player.hp}"><div class="bar-fill" style="width:${hpRatio}%"></div></div>
      <div class="bar xp-bar" role="progressbar" aria-label="Experiência" aria-valuemin="0" aria-valuemax="${neededXp}" aria-valuenow="${player.xp}" title="XP ${player.xp}/${neededXp}"><div class="bar-fill" style="width:${xpRatio}%"></div></div>
      <div class="hud-xp-label">${player.xp} / ${neededXp} XP</div>
    </div>`;

  refs.hudSide.innerHTML = `
    <div class="hud-world-meta"><span title="Ouro"><span class="ui-glyph glyph-coin" aria-hidden="true"></span><span>${player.gold} <small>ouro</small></span></span><span><span class="ui-glyph glyph-sun" aria-hidden="true"></span>Dia ${dayCount}</span></div>
    ${activeQuest ? `<div class="hud-quest"><strong>${activeQuest.title}</strong><span>${activeQuest.progress} / ${activeQuest.killTarget}</span></div>` : ""}
    ${player.unspentStatPoints > 0 ? `<div class="hud-points"><kbd>P</kbd> ${player.unspentStatPoints} ponto${player.unspentStatPoints > 1 ? "s" : ""} para distribuir</div>` : ""}
    ${nearGuideNpc ? '<div class="hud-interact"><kbd>E</kbd> Falar com o morador</div>' : ""}`;

  refs.hudBottom.innerHTML = `
    <div class="hud-combat" aria-label="Armas equipadas">
      <span title="${player.weapons.sword.name} — Clique esquerdo ou J"><span class="ui-glyph glyph-sword" aria-hidden="true"></span><span>Espada<kbd>J</kbd></span></span>
      <span title="${player.weapons.staff.name} — Clique direito ou K"><span class="ui-glyph glyph-staff" aria-hidden="true"></span><span>Magia<kbd>K</kbd></span></span>
      <span class="hud-bag-count" aria-label="${occupied} de ${player.inventory.length} espaços ocupados"><span class="ui-glyph glyph-bag" aria-hidden="true"></span>${occupied}<small> / ${player.inventory.length}</small></span>
    </div>`;

  refs.hudMessage.textContent = message;
  refs.hudMessage.classList.toggle("hidden", !message);
}
