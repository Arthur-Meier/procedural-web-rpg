import { PIXELS_PER_METER } from "../constants.js";
import { getRequiredElement } from "../dom.js";
import { centerMapOnPlayer, getWorldMapLayout, renderWorldMap } from "./world-map.js";
export class OverlayController {
    constructor(host, callbacks) {
        this.host = host;
        this.callbacks = callbacks;
    }
    bindUi() {
        getRequiredElement("newGameButton").addEventListener("click", () => this.callbacks.newGame());
        getRequiredElement("showLoadButton").addEventListener("click", () => {
            this.host.showingTitleLoads = true;
            this.callbacks.refreshSlotLists();
            this.syncUi();
        });
        getRequiredElement("backToTitleButton").addEventListener("click", () => {
            this.host.showingTitleLoads = false;
            this.syncUi();
        });
        getRequiredElement("exitButton").addEventListener("click", () => {
            window.close();
            this.callbacks.setMessage("Se o navegador nao fechar, feche a aba manualmente.", 4);
        });
        getRequiredElement("resumeButton").addEventListener("click", () => this.callbacks.resumeGame());
        getRequiredElement("backToMenuButton").addEventListener("click", () => this.callbacks.goToTitle());
        getRequiredElement("retryButton").addEventListener("click", () => this.callbacks.newGame());
        getRequiredElement("gameOverMenuButton").addEventListener("click", () => this.callbacks.goToTitle());
        getRequiredElement("closeStatsButton").addEventListener("click", () => this.closeStats());
        getRequiredElement("closeInventoryButton").addEventListener("click", () => this.closeInventory());
        getRequiredElement("closeQuestButton").addEventListener("click", () => this.closeQuestBoard());
        this.host.mapCanvas.addEventListener("mousedown", (event) => {
            if (event.button !== 0 || !this.host.mapOpen) {
                return;
            }
            const layout = this.getWorldMapLayout();
            if (!layout || !layout.canPan) {
                return;
            }
            this.host.mapDragging = true;
            this.host.mapDragLastX = event.clientX;
            this.host.mapDragLastY = event.clientY;
            this.host.mapCanvas.classList.add("dragging");
            event.preventDefault();
        });
        window.addEventListener("mousemove", (event) => {
            if (!this.host.mapDragging) {
                return;
            }
            this.host.mapPanX += event.clientX - this.host.mapDragLastX;
            this.host.mapPanY += event.clientY - this.host.mapDragLastY;
            this.host.mapDragLastX = event.clientX;
            this.host.mapDragLastY = event.clientY;
            this.renderWorldMap();
        });
        window.addEventListener("mouseup", () => this.stopMapDrag());
        window.addEventListener("blur", () => this.stopMapDrag());
        window.addEventListener("resize", () => this.resize());
    }
    resize() {
        this.host.canvas.width = window.innerWidth;
        this.host.canvas.height = window.innerHeight;
        this.host.camera.halfWidth = this.host.canvas.width / PIXELS_PER_METER / 2;
        this.host.camera.halfHeight = this.host.canvas.height / PIXELS_PER_METER / 2;
        if (this.host.mapOpen) {
            this.renderWorldMap();
        }
    }
    syncUi() {
        const overlayVisible = this.host.uiState !== "playing" ||
            this.host.mapOpen ||
            this.host.statsOpen ||
            this.host.inventoryOpen ||
            this.host.questBoardOpen;
        this.host.overlayVeil.classList.toggle("hidden", !overlayVisible);
        this.host.titlePanel.classList.toggle("hidden", this.host.uiState !== "title" || this.host.showingTitleLoads);
        this.host.titleLoadPanel.classList.toggle("hidden", this.host.uiState !== "title" || !this.host.showingTitleLoads);
        this.host.pausePanel.classList.toggle("hidden", this.host.uiState !== "paused");
        this.host.gameOverPanel.classList.toggle("hidden", this.host.uiState !== "gameOver");
        this.host.mapPanel.classList.toggle("hidden", !this.host.mapOpen);
        this.host.statsPanel.classList.toggle("hidden", !this.host.statsOpen);
        this.host.inventoryPanel.classList.toggle("hidden", !this.host.inventoryOpen);
        this.host.questPanel.classList.toggle("hidden", !this.host.questBoardOpen);
        this.host.hud.classList.toggle("hidden", !this.host.player || this.host.uiState === "title");
        this.host.hudMessage.classList.toggle("hidden", !this.host.message);
        if (!this.host.mapOpen) {
            this.stopMapDrag();
            this.host.mapCanvas.classList.remove("map-draggable");
        }
    }
    toggleMap() {
        if (!this.host.player || this.host.uiState !== "playing") {
            return;
        }
        this.setActiveOverlayPanel(this.host.mapOpen ? "none" : "map");
    }
    toggleStats() {
        if (!this.host.player || this.host.uiState !== "playing") {
            return;
        }
        this.setActiveOverlayPanel(this.host.statsOpen ? "none" : "stats");
    }
    closeStats() {
        this.setActiveOverlayPanel("none");
    }
    toggleInventory() {
        if (!this.host.player || this.host.uiState !== "playing") {
            return;
        }
        this.setActiveOverlayPanel(this.host.inventoryOpen ? "none" : "inventory");
    }
    closeInventory() {
        this.setActiveOverlayPanel("none");
    }
    openQuestBoard() {
        if (!this.host.player || this.host.uiState !== "playing") {
            return;
        }
        this.setActiveOverlayPanel("quests");
    }
    closeQuestBoard() {
        this.setActiveOverlayPanel("none");
    }
    openMap() {
        if (!this.host.player || this.host.uiState !== "playing") {
            return;
        }
        this.setActiveOverlayPanel("map");
    }
    closeMap() {
        this.setActiveOverlayPanel("none");
    }
    renderWorldMapIfOpen() {
        if (this.host.mapOpen) {
            this.renderWorldMap();
        }
    }
    setActiveOverlayPanel(panel) {
        if (!this.host.player || this.host.uiState !== "playing") {
            return;
        }
        this.host.mapOpen = panel === "map";
        this.host.statsOpen = panel === "stats";
        this.host.inventoryOpen = panel === "inventory";
        this.host.questBoardOpen = panel === "quests";
        this.syncUi();
        if (panel === "map") {
            this.centerMapOnPlayer();
            this.renderWorldMap();
            return;
        }
        if (panel === "stats") {
            this.callbacks.renderStatsPanel();
            return;
        }
        if (panel === "inventory") {
            this.callbacks.renderInventoryPanel();
            return;
        }
        if (panel === "quests") {
            this.callbacks.renderQuestBoard();
        }
    }
    stopMapDrag() {
        this.host.mapDragging = false;
        this.host.mapCanvas.classList.remove("dragging");
    }
    renderWorldMap() {
        if (!this.host.world || !this.host.player) {
            return;
        }
        const layout = renderWorldMap({
            world: this.host.world,
            player: this.host.player,
            mapCanvas: this.host.mapCanvas,
            mapContext: this.host.mapContext,
            seed: this.host.seed,
            mapPanX: this.host.mapPanX,
            mapPanY: this.host.mapPanY
        });
        if (!layout) {
            return;
        }
        this.host.mapPanX = layout.offsetX;
        this.host.mapPanY = layout.offsetY;
    }
    getWorldMapLayout() {
        if (!this.host.world || !this.host.player) {
            return null;
        }
        return getWorldMapLayout({
            world: this.host.world,
            player: this.host.player,
            mapCanvas: this.host.mapCanvas,
            mapPanX: this.host.mapPanX,
            mapPanY: this.host.mapPanY
        });
    }
    centerMapOnPlayer() {
        if (!this.host.world || !this.host.player) {
            return;
        }
        const pan = centerMapOnPlayer({
            world: this.host.world,
            player: this.host.player,
            mapCanvas: this.host.mapCanvas,
            mapPanX: this.host.mapPanX,
            mapPanY: this.host.mapPanY
        });
        if (!pan) {
            return;
        }
        this.host.mapPanX = pan.x;
        this.host.mapPanY = pan.y;
    }
}
