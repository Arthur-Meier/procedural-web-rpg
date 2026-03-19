import { SessionLifecycle } from "./session/lifecycle.js";
import { SessionSnapshotStore } from "./session/snapshot-store.js";
import type { SessionSnapshotService, SessionSystemHost } from "./session/types.js";

export type { SessionSystemHost } from "./session/types.js";

export class SessionSystem {
  private readonly lifecycle: SessionLifecycle;
  private readonly snapshotStore: SessionSnapshotService;

  constructor(host: SessionSystemHost) {
    this.lifecycle = new SessionLifecycle(host);
    this.snapshotStore = new SessionSnapshotStore(host);
  }

  newGame(): void {
    this.lifecycle.newGame();
  }

  goToTitle(): void {
    this.lifecycle.goToTitle();
  }

  resumeGame(): void {
    this.lifecycle.resumeGame();
  }

  openPause(): void {
    this.lifecycle.openPause();
  }

  buildSnapshot(slot: number) {
    return this.snapshotStore.buildSnapshot(slot);
  }

  saveGame(slot: number): void {
    this.snapshotStore.saveGame(slot);
  }

  loadGame(slot: number): void {
    this.snapshotStore.loadGame(slot);
  }
}
