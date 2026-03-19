import { ITEMS, WEAPONS } from "../../constants.js";
import { getItemTokenMarkup, getWeaponTokenMarkup } from "../../state-helpers.js";
const ARMOR_EQUIPMENT_SLOTS = [
    { label: "Capacete", short: "CAB" },
    { label: "Peitoral", short: "ARM" },
    { label: "Luvas", short: "LUV" },
    { label: "Calcas", short: "CAL" },
    { label: "Botas", short: "BOT" }
];
export function renderInventoryPanel(refs, player, onEquipWeapon, _onCraftWeapon) {
    renderCharacterPreview(refs, player);
    renderArmorSlots(refs);
    renderWorkbench(refs);
    renderOutputSlot(refs);
    renderInventorySlots(refs, player, onEquipWeapon);
}
function renderCharacterPreview(refs, player) {
    refs.inventoryCharacter.replaceChildren();
    const card = document.createElement("article");
    card.className = "inventory-character-card";
    card.innerHTML = `
    <div class="inventory-character-header">
      <div>
        <strong>Aventureiro</strong>
        <small>Nivel ${player.level} | Ouro ${player.gold}</small>
      </div>
      <span class="inventory-character-pill">HP ${player.hp}/${player.maxHp}</span>
    </div>

    <div class="inventory-character-stage">
      <div class="inventory-character-figure" aria-hidden="true">
        <span class="inventory-character-shadow"></span>
        <span class="inventory-character-cape"></span>
        <span class="inventory-character-legs"></span>
        <span class="inventory-character-boots"></span>
        <span class="inventory-character-body"></span>
        <span class="inventory-character-belt"></span>
        <span class="inventory-character-head"></span>
        <span class="inventory-character-hair"></span>
        <span class="inventory-character-sword"></span>
        <span class="inventory-character-staff"></span>
      </div>
    </div>

    <div class="inventory-character-loadout" aria-label="Armas equipadas">
      <div class="inventory-character-chip" data-tooltip="${player.weapons.sword.name}" aria-label="${player.weapons.sword.name}">
        ${getWeaponTokenMarkup(player.weapons.sword.id)}
      </div>
      <div class="inventory-character-chip" data-tooltip="${player.weapons.staff.name}" aria-label="${player.weapons.staff.name}">
        ${getWeaponTokenMarkup(player.weapons.staff.id)}
      </div>
    </div>
  `;
    refs.inventoryCharacter.append(card);
}
function renderArmorSlots(refs) {
    refs.inventoryEquipment.replaceChildren();
    for (const slot of ARMOR_EQUIPMENT_SLOTS) {
        const card = document.createElement("article");
        card.className = "equipment-slot-card";
        card.dataset.tooltip = slot.label;
        card.setAttribute("aria-label", slot.label);
        card.innerHTML = `<span class="equipment-slot-glyph">${slot.short}</span>`;
        refs.inventoryEquipment.append(card);
    }
}
function renderWorkbench(refs) {
    refs.craftingWorkbench.replaceChildren();
    for (let index = 0; index < 9; index += 1) {
        const cell = document.createElement("div");
        cell.className = "workbench-cell";
        cell.setAttribute("aria-hidden", "true");
        refs.craftingWorkbench.append(cell);
    }
}
function renderOutputSlot(refs) {
    refs.craftingOutput.replaceChildren();
    const outputCard = document.createElement("div");
    outputCard.className = "workbench-cell crafting-output-slot";
    outputCard.setAttribute("aria-label", "Resultado da craftagem");
    refs.craftingOutput.append(outputCard);
}
function renderInventorySlots(refs, player, onEquipWeapon) {
    const occupiedSlots = player.inventory.filter((slot) => Boolean(slot)).length;
    refs.inventoryCapacity.textContent = `${occupiedSlots}/${player.inventory.length} slots ocupados`;
    refs.inventoryPanelGrid.replaceChildren();
    player.inventory.forEach((slot, index) => {
        const card = document.createElement("article");
        card.className = "inventory-storage-slot";
        card.setAttribute("data-slot-index", String(index + 1));
        const indexBadge = document.createElement("span");
        indexBadge.className = "inventory-slot-index";
        indexBadge.textContent = String(index + 1);
        card.append(indexBadge);
        const content = document.createElement("div");
        content.className = "inventory-storage-content";
        if (!slot) {
            card.classList.add("empty");
            content.innerHTML = `<span class="inventory-storage-placeholder" aria-hidden="true"></span>`;
        }
        else if (slot.kind === "weapon") {
            const weapon = WEAPONS[slot.weaponId];
            const modifier = weapon.slot === "sword" ? `Fisico ${weapon.physicalMultiplier}x` : `Magico ${weapon.magicMultiplier}x`;
            const isEquipped = (weapon.slot === "sword" && player.weapons.sword.id === weapon.id) ||
                (weapon.slot === "staff" && player.weapons.staff.id === weapon.id);
            content.innerHTML = `
        <span class="inventory-storage-token" aria-hidden="true">
          ${getWeaponTokenMarkup(weapon.id)}
        </span>
      `;
            card.dataset.tooltip = `${weapon.name} | ${modifier}${isEquipped ? " | Equipada" : " | Clique para equipar"}`;
            const badge = document.createElement("span");
            badge.className = "inventory-slot-badge";
            badge.textContent = isEquipped ? "ON" : "EQP";
            card.append(badge);
            if (isEquipped) {
                card.classList.add("equipped");
            }
            else {
                card.classList.add("equipable");
                bindInventoryActivation(card, () => onEquipWeapon(weapon.id));
            }
        }
        else {
            const item = ITEMS[slot.itemId];
            content.innerHTML = `
        <span class="inventory-storage-token" aria-hidden="true">
          ${getItemTokenMarkup(item.id)}
        </span>
      `;
            card.dataset.tooltip = `${item.name} | x${slot.count}`;
            const badge = document.createElement("span");
            badge.className = "inventory-slot-badge";
            badge.textContent = `x${slot.count}`;
            card.append(badge);
        }
        card.append(content);
        refs.inventoryPanelGrid.append(card);
    });
}
function bindInventoryActivation(element, onActivate) {
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.addEventListener("click", onActivate);
    element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onActivate();
        }
    });
}
