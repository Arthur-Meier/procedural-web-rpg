import { ENEMY_MAX_ALIVE, INVENTORY_SIZE, ITEMS, WEAPONS } from "../../constants.js";
import { getItemTokenMarkup, getWeaponTokenMarkup, xpRequiredForNextLevel } from "../../state-helpers.js";
export function updateHud(refs, player, enemies, message, nearGuideNpc, activeQuest, dayCount) {
    const hpRatio = player.maxHp ? (player.hp / player.maxHp) * 100 : 0;
    const xpRatio = (player.xp / xpRequiredForNextLevel(player.level)) * 100;
    const aliveEnemies = enemies.filter((enemy) => !enemy.dead).length;
    refs.hudTop.innerHTML = `
      <strong>Nivel ${player.level}</strong>
      <div style="margin-top:10px; color:#f6e7bd;">Vida ${player.hp}/${player.maxHp}</div>
      <div class="bar" style="margin-top:10px;">
        <div class="bar-fill" style="width:${hpRatio}%; background:linear-gradient(90deg, #ce473b 0%, #ed8d5f 100%);"></div>
      </div>
      ${activeQuest
        ? `<div class="active-quest-pill"><strong>${activeQuest.title}</strong><small>${activeQuest.progress}/${activeQuest.killTarget} inimigos | ${activeQuest.rewardGold} ouro</small></div>`
        : ""}
      <div style="margin-top:10px; color:#f6e7bd;">XP ${player.xp}/${xpRequiredForNextLevel(player.level)}</div>
      <div class="bar" style="margin-top:10px;">
        <div class="bar-fill" style="width:${xpRatio}%; background:linear-gradient(90deg, #4aa5ff 0%, #7fdcff 100%);"></div>
      </div>
      <div style="margin-top:10px; color:#f6e7bd;">Ouro: ${player.gold} | Dia ${dayCount}</div>
      <div style="margin-top:6px; color:#d8cfae; font-size:0.9rem;">Pontos livres: ${player.unspentStatPoints}</div>
    `;
    refs.hudSide.innerHTML = `
      <strong>Visao rapida</strong>
      <div style="margin-top:10px; color:#f6e7bd;">Inimigos vivos: ${aliveEnemies}/${ENEMY_MAX_ALIVE}</div>
      <div style="margin-top:8px; color:#f6e7bd;">Espada: ${player.weapons.sword.name}</div>
      <div style="margin-top:6px; color:#f6e7bd;">Cajado: ${player.weapons.staff.name}</div>
      <div style="margin-top:8px; color:#d9cfb0; font-size:0.92rem;">
        Pressione <strong>P</strong> para atributos e <strong>I</strong> para inventario, bancada e equipamentos.
      </div>
      <div style="margin-top:8px; color:#cbc1a1; font-size:0.92rem;">
        Controles: WASD mover, clique esquerdo/J espada, clique direito/K magia, E interagir, M mapa, Esc pause.
      </div>
      ${nearGuideNpc
        ? `<div style="margin-top:8px; color:#ffe5a3; font-size:0.92rem;">Pressione <strong>E</strong> para falar com o morador ou clique na plaquinha de missoes.</div>`
        : ""}
    `;
    refs.hudBottom.innerHTML = `
      <strong class="inventory-strip-title">Inventario (${INVENTORY_SIZE})</strong>
      <div class="inventory-grid">
        ${player.inventory
        .map((slot, index) => {
        if (!slot) {
            return `
                <div class="inventory-slot empty" aria-hidden="true">
                  <span class="inventory-slot-index">${index + 1}</span>
                </div>
              `;
        }
        if (slot.kind === "weapon") {
            const weapon = WEAPONS[slot.weaponId];
            const mod = weapon.slot === "sword" ? `Fisico ${weapon.physicalMultiplier}x` : `Magico ${weapon.magicMultiplier}x`;
            return `
                <div class="inventory-slot" title="${weapon.name} | ${mod}" data-tooltip="${weapon.name} | ${mod}">
                  ${getWeaponTokenMarkup(weapon.id)}
                  <span class="inventory-slot-badge">${weapon.slot === "sword" ? `${weapon.physicalMultiplier}x` : `${weapon.magicMultiplier}x`}</span>
                </div>
              `;
        }
        return `
              <div class="inventory-slot" title="${ITEMS[slot.itemId].name} | x${slot.count}" data-tooltip="${ITEMS[slot.itemId].name} | x${slot.count}">
                ${getItemTokenMarkup(slot.itemId)}
                <span class="inventory-slot-badge">x${slot.count}</span>
              </div>
            `;
    })
        .join("")}
      </div>
    `;
    refs.hudMessage.textContent = message;
    refs.hudMessage.classList.toggle("hidden", !message);
}
