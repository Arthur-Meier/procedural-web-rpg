import { SAVE_SLOT_COUNT } from "./game/constants.js";
import { DayNightSystem } from "./game/day-night.js";
import { InputManager } from "./game/input.js";
import { WorldRenderer } from "./game/render/world-renderer.js";
import { listSaveSlots } from "./game/save.js";
import { createRendererState, createCombatSystemHost, createMovementSystemHost, createProgressionSystemHost, createSessionSystemHost, createSpawnSystemHost } from "./game/runtime/system-hosts.js";
import { CombatSystem } from "./game/systems/combat-system.js";
import { MovementSystem } from "./game/systems/movement-system.js";
import { ProgressionSystem } from "./game/systems/progression-system.js";
import { QuestSystem } from "./game/systems/quest-system.js";
import { SessionSystem } from "./game/systems/session-system.js";
import { SpawnSystem } from "./game/systems/spawn-system.js";
import { createQuestBoardState } from "./game/state-helpers.js";
import { createGameUiElements } from "./game/ui/elements.js";
import { renderInventoryPanel as renderInventoryPanelView, renderLoadList as renderLoadListView, renderSaveList as renderSaveListView, renderStatsPanel as renderStatsPanelView, updateHud as updateHudView } from "./game/ui/panels.js";
import { OverlayController } from "./game/ui/overlay-controller.js";
import { GameLoop } from "./game/runtime/game-loop.js";
class Game {
    constructor() {
        const ui = createGameUiElements();
        this.canvas = ui.canvas;
        const context = this.canvas.getContext("2d");
        if (!context) {
            throw new Error("Nao foi possivel obter o contexto 2D do canvas principal.");
        }
        this.ctx = context;
        this.mapCanvas = ui.mapCanvas;
        const mapContext = this.mapCanvas.getContext("2d");
        if (!mapContext) {
            throw new Error("Nao foi possivel obter o contexto 2D do mapa.");
        }
        this.mapContext = mapContext;
        this.worldRenderer = new WorldRenderer(this.ctx, this.canvas);
        this.hud = ui.hud;
        this.hudTop = ui.hudTop;
        this.hudSide = ui.hudSide;
        this.hudBottom = ui.hudBottom;
        this.hudMessage = ui.hudMessage;
        this.overlayVeil = ui.overlayVeil;
        this.titlePanel = ui.titlePanel;
        this.titleLoadPanel = ui.titleLoadPanel;
        this.pausePanel = ui.pausePanel;
        this.gameOverPanel = ui.gameOverPanel;
        this.mapPanel = ui.mapPanel;
        this.statsPanel = ui.statsPanel;
        this.inventoryPanel = ui.inventoryPanel;
        this.questPanel = ui.questPanel;
        this.statsOverview = ui.statsOverview;
        this.statsAllocation = ui.statsAllocation;
        this.inventoryCharacter = ui.inventoryCharacter;
        this.inventoryEquipment = ui.inventoryEquipment;
        this.craftingWorkbench = ui.craftingWorkbench;
        this.craftingOutput = ui.craftingOutput;
        this.inventoryCapacity = ui.inventoryCapacity;
        this.inventoryPanelGrid = ui.inventoryPanelGrid;
        this.questBoardList = ui.questBoardList;
        this.titleLoadSlots = ui.titleLoadSlots;
        this.pauseSaveSlots = ui.pauseSaveSlots;
        this.pauseLoadSlots = ui.pauseLoadSlots;
        this.gameOverLoadSlots = ui.gameOverLoadSlots;
        this.uiState = "title";
        this.mapOpen = false;
        this.statsOpen = false;
        this.inventoryOpen = false;
        this.questBoardOpen = false;
        this.showingTitleLoads = false;
        this.player = null;
        this.world = null;
        this.enemies = [];
        this.projectiles = [];
        this.drops = [];
        this.particles = [];
        this.burnEffects = [];
        this.floatingTexts = [];
        this.pendingSpellCasts = [];
        this.enemyDeathEffects = [];
        this.playerAuraEffects = [];
        this.pendingRespawns = [];
        this.seed = 0;
        this.enemyIdCounter = 1;
        this.dropIdCounter = 1;
        this.projectileIdCounter = 1;
        this.effectIdCounter = 1;
        this.camera = { x: 0, y: 0, halfWidth: 0, halfHeight: 0 };
        this.dayNightSystem = new DayNightSystem();
        this.dayCount = 1;
        this.message = "";
        this.messageTimer = 0;
        this.lastTimestamp = 0;
        this.mapPanX = 0;
        this.mapPanY = 0;
        this.mapDragging = false;
        this.mapDragLastX = 0;
        this.mapDragLastY = 0;
        this.quests = createQuestBoardState();
        this.input = new InputManager(this.canvas);
        const thisRef = this;
        let movementSystem;
        let combatSystem;
        let spawnSystem;
        let progressionSystem;
        let sessionSystem;
        let questSystem;
        this.overlayController = new OverlayController(this, {
            newGame: () => sessionSystem.newGame(),
            goToTitle: () => sessionSystem.goToTitle(),
            resumeGame: () => sessionSystem.resumeGame(),
            refreshSlotLists: () => this.refreshSlotLists(),
            renderStatsPanel: () => this.renderStatsPanel(),
            renderInventoryPanel: () => this.renderInventoryPanel(),
            renderQuestBoard: () => questSystem.renderQuestBoard(),
            setMessage: (text, duration) => this.setMessage(text, duration)
        });
        this.questSystem = questSystem = new QuestSystem({
            get player() {
                return thisRef.player;
            },
            get quests() {
                return thisRef.quests;
            },
            get questBoardOpen() {
                return thisRef.questBoardOpen;
            },
            get questBoardList() {
                return thisRef.questBoardList;
            },
            setMessage: (text, duration) => this.setMessage(text, duration),
            closeQuestBoard: () => this.overlayController.closeQuestBoard()
        });
        this.spawnSystem = spawnSystem = new SpawnSystem(createSpawnSystemHost(this));
        this.progressionSystem = progressionSystem = new ProgressionSystem(createProgressionSystemHost(this, {
            renderStatsPanel: () => this.renderStatsPanel(),
            renderInventoryPanel: () => this.renderInventoryPanel(),
            updateHud: () => this.updateHud(),
            setMessage: (text, duration) => this.setMessage(text, duration),
            spawnLevelUpEffect: () => combatSystem.spawnLevelUpEffect()
        }));
        this.movementSystem = movementSystem = new MovementSystem(createMovementSystemHost(this, {
            syncDerivedStats: () => progressionSystem.syncDerivedStats(),
            openQuestBoard: () => this.overlayController.openQuestBoard(),
            performSwordAttack: () => combatSystem.performSwordAttack(),
            castFireball: () => combatSystem.castFireball(),
            setMessage: (text, duration) => this.setMessage(text, duration)
        }));
        this.combatSystem = combatSystem = new CombatSystem(createCombatSystemHost(this, {
            moveEntity: (entity, dx, dy) => movementSystem.moveEntity(entity, dx, dy),
            pickEnemySpawnTemplate: () => spawnSystem.pickEnemySpawnTemplate(),
            registerQuestKill: () => questSystem.registerQuestKill(),
            grantXp: (amount) => progressionSystem.grantXp(amount),
            setMessage: (text, duration) => this.setMessage(text, duration)
        }));
        this.sessionSystem = sessionSystem = new SessionSystem(createSessionSystemHost(this, {
            spawnInitialEnemies: () => spawnSystem.spawnInitialEnemies(),
            pickEnemySpawnTemplate: () => spawnSystem.pickEnemySpawnTemplate(),
            syncDerivedStats: () => progressionSystem.syncDerivedStats(),
            refreshSlotLists: () => this.refreshSlotLists(),
            syncUi: () => this.overlayController.syncUi(),
            setMessage: (text, duration) => this.setMessage(text, duration)
        }));
        this.gameLoop = new GameLoop({
            get player() {
                return thisRef.player;
            },
            get world() {
                return thisRef.world;
            },
            get uiState() {
                return thisRef.uiState;
            },
            set uiState(value) {
                thisRef.uiState = value;
            },
            get mapOpen() {
                return thisRef.mapOpen;
            },
            get statsOpen() {
                return thisRef.statsOpen;
            },
            get inventoryOpen() {
                return thisRef.inventoryOpen;
            },
            get questBoardOpen() {
                return thisRef.questBoardOpen;
            },
            get message() {
                return thisRef.message;
            },
            set message(value) {
                thisRef.message = value;
            },
            get messageTimer() {
                return thisRef.messageTimer;
            },
            set messageTimer(value) {
                thisRef.messageTimer = value;
            },
            get lastTimestamp() {
                return thisRef.lastTimestamp;
            },
            set lastTimestamp(value) {
                thisRef.lastTimestamp = value;
            },
            get input() {
                return thisRef.input;
            },
            get dayCount() {
                return thisRef.dayCount;
            },
            set dayCount(value) {
                thisRef.dayCount = value;
            },
            get dayNightSystem() {
                return thisRef.dayNightSystem;
            },
            get movementSystem() {
                return thisRef.movementSystem;
            },
            get combatSystem() {
                return thisRef.combatSystem;
            },
            get spawnSystem() {
                return thisRef.spawnSystem;
            },
            get progressionSystem() {
                return thisRef.progressionSystem;
            },
            get questSystem() {
                return thisRef.questSystem;
            },
            syncUi: () => this.overlayController.syncUi(),
            refreshSlotLists: () => this.refreshSlotLists(),
            render: () => this.render()
        }, {
            openPause: () => sessionSystem.openPause(),
            resumeGame: () => sessionSystem.resumeGame(),
            toggleMap: () => this.overlayController.toggleMap(),
            toggleStats: () => this.overlayController.toggleStats(),
            toggleInventory: () => this.overlayController.toggleInventory(),
            closeQuestBoard: () => this.overlayController.closeQuestBoard()
        });
        this.overlayController.bindUi();
        this.overlayController.resize();
        this.refreshSlotLists();
        this.overlayController.syncUi();
        this.gameLoop.start();
    }
    refreshSlotLists() {
        const slots = listSaveSlots(SAVE_SLOT_COUNT);
        renderLoadListView({ container: this.titleLoadSlots, slots }, (slot) => this.sessionSystem.loadGame(slot));
        renderSaveListView({ container: this.pauseSaveSlots, slots }, this.player, (slot) => this.sessionSystem.saveGame(slot));
        renderLoadListView({ container: this.pauseLoadSlots, slots }, (slot) => this.sessionSystem.loadGame(slot));
        renderLoadListView({ container: this.gameOverLoadSlots, slots }, (slot) => this.sessionSystem.loadGame(slot));
    }
    renderInventoryPanel() {
        if (!this.player) {
            return;
        }
        renderInventoryPanelView({
            inventoryCharacter: this.inventoryCharacter,
            inventoryEquipment: this.inventoryEquipment,
            craftingWorkbench: this.craftingWorkbench,
            craftingOutput: this.craftingOutput,
            inventoryCapacity: this.inventoryCapacity,
            inventoryPanelGrid: this.inventoryPanelGrid
        }, this.player, (weaponId) => this.progressionSystem.equipWeapon(weaponId), (recipeId) => this.progressionSystem.craftWeapon(recipeId));
    }
    renderStatsPanel() {
        if (!this.player) {
            return;
        }
        renderStatsPanelView({
            statsOverview: this.statsOverview,
            statsAllocation: this.statsAllocation
        }, this.player, (statKey) => this.progressionSystem.spendStatPoint(statKey));
    }
    updateHud() {
        if (!this.player) {
            return;
        }
        updateHudView({
            hudTop: this.hudTop,
            hudSide: this.hudSide,
            hudBottom: this.hudBottom,
            hudMessage: this.hudMessage
        }, this.player, this.enemies, this.message, this.movementSystem.isNearGuideNpc(), this.questSystem.getActiveQuest(), this.dayCount);
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.world && this.player) {
            this.worldRenderer.render(createRendererState(this, {
                resolveSpellCastSource: (cast) => this.combatSystem.resolveSpellCastSource(cast),
                isNearGuideNpc: () => this.movementSystem.isNearGuideNpc()
            }));
            this.updateHud();
        }
        this.overlayController.renderWorldMapIfOpen();
    }
    setMessage(text, duration = 2.6) {
        this.message = text;
        this.messageTimer = duration;
        this.hudMessage.textContent = text;
        this.overlayController.syncUi();
    }
}
new Game();
