import type { GameSnapshot, SaveSlotSummary } from "./types.js";

const STORAGE_PREFIX = "rpg-mundo-aberto-slot-";

function slotKey(slotNumber: number): string {
  return `${STORAGE_PREFIX}${slotNumber}`;
}

export function listSaveSlots(totalSlots: number): SaveSlotSummary[] {
  const slots: SaveSlotSummary[] = [];
  for (let slot = 1; slot <= totalSlots; slot += 1) {
    const raw = window.localStorage.getItem(slotKey(slot));
    if (!raw) {
      slots.push({
        slot,
        empty: true
      });
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<GameSnapshot>;
      if (!parsed.meta) {
        throw new Error("Snapshot sem metadados.");
      }

      slots.push({
        slot,
        empty: false,
        meta: parsed.meta
      });
    } catch (error) {
      slots.push({
        slot,
        empty: true,
        corrupted: true
      });
    }
  }
  return slots;
}

export function saveToSlot(slotNumber: number, snapshot: GameSnapshot): void {
  window.localStorage.setItem(slotKey(slotNumber), JSON.stringify(snapshot));
}

export function loadFromSlot(slotNumber: number): GameSnapshot | null {
  const raw = window.localStorage.getItem(slotKey(slotNumber));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GameSnapshot;
  } catch (error) {
    return null;
  }
}
