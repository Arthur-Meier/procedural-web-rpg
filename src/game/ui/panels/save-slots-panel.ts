import { formatTimestamp } from "../../utils.js";
import type { SaveListRenderArgs } from "../../app-types.js";
import type { Player } from "../../types.js";

export function renderSaveList(
  args: SaveListRenderArgs,
  player: Player | null,
  onSave: (slot: number) => void
): void {
  args.container.replaceChildren();

  for (const slot of args.slots) {
    const card = document.createElement("article");
    card.className = "slot-card";

    const title = document.createElement("strong");
    title.textContent = `Slot ${slot.slot}`;

    const meta = document.createElement("small");
    if (slot.empty) {
      meta.textContent = "Sem save salvo.";
    } else {
      meta.textContent = `Ultimo save: ${formatTimestamp(slot.meta.savedAt)} | Lv ${slot.meta.level ?? 1} | Ouro: ${slot.meta.gold}`;
    }

    const button = document.createElement("button");
    button.textContent = "Salvar";
    button.disabled = !player;
    button.addEventListener("click", () => onSave(slot.slot));

    card.append(title, meta, button);
    args.container.append(card);
  }
}

export function renderLoadList(args: SaveListRenderArgs, onLoad: (slot: number) => void): void {
  args.container.replaceChildren();

  for (const slot of args.slots) {
    const card = document.createElement("article");
    card.className = "slot-card";

    const title = document.createElement("strong");
    title.textContent = `Slot ${slot.slot}`;

    const meta = document.createElement("small");
    if (slot.empty) {
      meta.textContent = slot.corrupted ? "Save corrompido." : "Sem save salvo.";
    } else {
      const position = slot.meta.position || { x: 0, y: 0 };
      meta.textContent = `${formatTimestamp(slot.meta.savedAt)} | Lv ${slot.meta.level ?? 1} | HP: ${slot.meta.hp} | X:${position.x} Y:${position.y}`;
    }

    const button = document.createElement("button");
    button.textContent = "Carregar";
    button.disabled = slot.empty;
    button.addEventListener("click", () => onLoad(slot.slot));

    card.append(title, meta, button);
    args.container.append(card);
  }
}
