import type { Bounds, SaveSlotSummary, StatKey, WeaponId } from "../types.js";

export interface WorldMapLayout {
  bounds: Bounds;
  cell: number;
  contentWidth: number;
  contentHeight: number;
  minOffsetX: number;
  maxOffsetX: number;
  minOffsetY: number;
  maxOffsetY: number;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
  canPan: boolean;
}

export interface StructureBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FriendlyNpc {
  x: number;
  y: number;
  radius: number;
  dialog: string;
}

export interface QuestSign {
  x: number;
  y: number;
  radius: number;
}

export interface InventoryPanelRefs {
  inventoryCharacter: HTMLElement;
  inventoryEquipment: HTMLElement;
  craftingWorkbench: HTMLElement;
  craftingOutput: HTMLElement;
  inventoryCapacity: HTMLElement;
  inventoryPanelGrid: HTMLElement;
}

export interface StatsPanelRefs {
  statsOverview: HTMLElement;
  statsAllocation: HTMLElement;
}

export interface HudRefs {
  hudTop: HTMLElement;
  hudSide: HTMLElement;
  hudBottom: HTMLElement;
  hudMessage: HTMLElement;
}

export interface SaveListRenderArgs {
  container: HTMLElement;
  slots: SaveSlotSummary[];
}

export interface GameUiElements extends InventoryPanelRefs, StatsPanelRefs, HudRefs {
  canvas: HTMLCanvasElement;
  mapCanvas: HTMLCanvasElement;
  hud: HTMLElement;
  overlayVeil: HTMLElement;
  titlePanel: HTMLElement;
  titleLoadPanel: HTMLElement;
  pausePanel: HTMLElement;
  gameOverPanel: HTMLElement;
  mapPanel: HTMLElement;
  statsPanel: HTMLElement;
  inventoryPanel: HTMLElement;
  questPanel: HTMLElement;
  questBoardList: HTMLElement;
  titleLoadSlots: HTMLElement;
  pauseSaveSlots: HTMLElement;
  pauseLoadSlots: HTMLElement;
  gameOverLoadSlots: HTMLElement;
}

export type QuestRenderHandler = (questId: string) => void;
export type WeaponEquipHandler = (weaponId: WeaponId) => void;
export type CraftWeaponHandler = (recipeId: string) => void;
export type SpendStatPointHandler = (statKey: StatKey) => void;
