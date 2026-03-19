import { SessionLifecycle } from "./session/lifecycle.js";
import { SessionSnapshotStore } from "./session/snapshot-store.js";
export class SessionSystem {
    constructor(host) {
        this.lifecycle = new SessionLifecycle(host);
        this.snapshotStore = new SessionSnapshotStore(host);
    }
    newGame() {
        this.lifecycle.newGame();
    }
    goToTitle() {
        this.lifecycle.goToTitle();
    }
    resumeGame() {
        this.lifecycle.resumeGame();
    }
    openPause() {
        this.lifecycle.openPause();
    }
    buildSnapshot(slot) {
        return this.snapshotStore.buildSnapshot(slot);
    }
    saveGame(slot) {
        this.snapshotStore.saveGame(slot);
    }
    loadGame(slot) {
        this.snapshotStore.loadGame(slot);
    }
}
