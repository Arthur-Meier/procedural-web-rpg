import { getRequiredElement } from "../dom.js";
import type { GameUiElements } from "../app-types.js";

export function createGameUiElements(): GameUiElements {
  return {
    canvas: getRequiredElement<HTMLCanvasElement>("gameCanvas"),
    mapCanvas: getRequiredElement<HTMLCanvasElement>("mapCanvas"),
    hud: getRequiredElement("hud"),
    hudTop: getRequiredElement("hudTop"),
    hudSide: getRequiredElement("hudSide"),
    hudBottom: getRequiredElement("hudBottom"),
    hudMessage: getRequiredElement("hudMessage"),
    overlayVeil: getRequiredElement("overlayVeil"),
    titlePanel: getRequiredElement("titlePanel"),
    titleLoadPanel: getRequiredElement("titleLoadPanel"),
    pausePanel: getRequiredElement("pausePanel"),
    gameOverPanel: getRequiredElement("gameOverPanel"),
    mapPanel: getRequiredElement("mapPanel"),
    statsPanel: getRequiredElement("statsPanel"),
    inventoryPanel: getRequiredElement("inventoryPanel"),
    questPanel: getRequiredElement("questPanel"),
    statsOverview: getRequiredElement("statsOverview"),
    statsAllocation: getRequiredElement("statsAllocation"),
    inventoryCharacter: getRequiredElement("inventoryCharacter"),
    inventoryEquipment: getRequiredElement("inventoryEquipment"),
    craftingWorkbench: getRequiredElement("craftingWorkbench"),
    craftingOutput: getRequiredElement("craftingOutput"),
    inventoryCapacity: getRequiredElement("inventoryCapacity"),
    inventoryPanelGrid: getRequiredElement("inventoryPanelGrid"),
    questBoardList: getRequiredElement("questBoardList"),
    titleLoadSlots: getRequiredElement("titleLoadSlots"),
    pauseSaveSlots: getRequiredElement("pauseSaveSlots"),
    pauseLoadSlots: getRequiredElement("pauseLoadSlots"),
    gameOverLoadSlots: getRequiredElement("gameOverLoadSlots")
  };
}
