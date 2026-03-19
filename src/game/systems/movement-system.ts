import { PIXELS_PER_METER } from "../constants.js";
import { GUIDE_NPC, GUIDE_NPC_TALK_DISTANCE, QUEST_SIGN, SPAWN_HOUSE_COLLIDER } from "../game-config.js";
import { computeMoveSpeed } from "../state-helpers.js";
import { angleBetween, clamp, distance, normalize } from "../utils.js";
import type { CameraState, Player } from "../types.js";
import { World } from "../world.js";
import { InputManager } from "../input.js";

interface CollisionEntity {
  x: number;
  y: number;
  radius: number;
}

export interface MovementSystemHost {
  player: Player;
  world: World;
  camera: CameraState;
  canvas: HTMLCanvasElement;
  input: InputManager;
  syncDerivedStats(): void;
  openQuestBoard(): void;
  performSwordAttack(): void;
  castFireball(): void;
  setMessage(text: string, duration?: number): void;
}

export class MovementSystem {
  constructor(private readonly host: MovementSystemHost) {}

  updatePlayer(dt: number): void {
    this.host.syncDerivedStats();
    const axis = this.host.input.getAxis();
    const move = normalize(axis.x, axis.y);
    const speed = computeMoveSpeed(this.host.player);

    if (this.host.input.mouse.inside) {
      const worldMouse = this.screenToWorld(this.host.input.mouse.x, this.host.input.mouse.y);
      this.host.player.facingAngle = angleBetween(this.host.player.x, this.host.player.y, worldMouse.x, worldMouse.y);
    } else if (move.length > 0) {
      this.host.player.facingAngle = Math.atan2(move.y, move.x);
    }

    if (move.length > 0) {
      this.moveEntity(this.host.player, move.x * speed * dt, move.y * speed * dt);
    }

    if (this.host.input.pressedKey("e")) {
      this.talkToGuideNpc();
    }

    if (this.host.input.mouseClicked(0) && this.host.input.mouse.inside) {
      const worldMouse = this.screenToWorld(this.host.input.mouse.x, this.host.input.mouse.y);
      if (this.isQuestSignHit(worldMouse)) {
        this.host.openQuestBoard();
        return;
      }
    }

    if ((this.host.input.mouseClicked(0) || this.host.input.pressed("KeyJ")) && this.host.player.meleeCooldown <= 0) {
      this.host.performSwordAttack();
    }

    if ((this.host.input.mouseClicked(2) || this.host.input.pressed("KeyK")) && this.host.player.magicCooldown <= 0) {
      this.host.castFireball();
    }
  }

  updateCamera(strength: number): void {
    this.host.camera.x = this.host.camera.x + (this.host.player.x - this.host.camera.x) * strength;
    this.host.camera.y = this.host.camera.y + (this.host.player.y - this.host.camera.y) * strength;
  }

  getCameraBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: this.host.camera.x - this.host.camera.halfWidth,
      maxX: this.host.camera.x + this.host.camera.halfWidth,
      minY: this.host.camera.y - this.host.camera.halfHeight,
      maxY: this.host.camera.y + this.host.camera.halfHeight
    };
  }

  screenToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: this.host.camera.x + (x - this.host.canvas.width / 2) / PIXELS_PER_METER,
      y: this.host.camera.y + (y - this.host.canvas.height / 2) / PIXELS_PER_METER
    };
  }

  worldToScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.host.camera.x) * PIXELS_PER_METER + this.host.canvas.width / 2,
      y: (y - this.host.camera.y) * PIXELS_PER_METER + this.host.canvas.height / 2
    };
  }

  isNearGuideNpc(): boolean {
    return distance(this.host.player.x, this.host.player.y, GUIDE_NPC.x, GUIDE_NPC.y) <=
      this.host.player.radius + GUIDE_NPC.radius + GUIDE_NPC_TALK_DISTANCE;
  }

  talkToGuideNpc(): void {
    if (this.isNearGuideNpc()) {
      this.host.setMessage(GUIDE_NPC.dialog, 2.8);
    }
  }

  moveEntity(entity: CollisionEntity, dx: number, dy: number): void {
    if (!dx && !dy) {
      return;
    }

    if (dx) {
      entity.x += dx;
      this.resolveSolidCollisions(entity);
    }

    if (dy) {
      entity.y += dy;
      this.resolveSolidCollisions(entity);
    }
  }

  resolveSolidCollisions(entity: CollisionEntity): void {
    const solids = this.host.world.getObjectsNear(entity.x, entity.y, entity.radius + 1.8);
    for (const solid of solids) {
      const offsetX = entity.x - solid.x;
      const offsetY = entity.y - solid.y;
      const currentDistance = Math.hypot(offsetX, offsetY);
      const minimumDistance = entity.radius + solid.radius;

      if (currentDistance === 0) {
        entity.x += minimumDistance;
        continue;
      }

      if (currentDistance >= minimumDistance) {
        continue;
      }

      const overlap = minimumDistance - currentDistance;
      entity.x += (offsetX / currentDistance) * overlap;
      entity.y += (offsetY / currentDistance) * overlap;
    }

    const npcDistance = distance(entity.x, entity.y, GUIDE_NPC.x, GUIDE_NPC.y);
    const npcMinimumDistance = entity.radius + GUIDE_NPC.radius;
    if (npcDistance > 0 && npcDistance < npcMinimumDistance) {
      const overlap = npcMinimumDistance - npcDistance;
      entity.x += ((entity.x - GUIDE_NPC.x) / npcDistance) * overlap;
      entity.y += ((entity.y - GUIDE_NPC.y) / npcDistance) * overlap;
    }

    this.resolveStructureCollision(entity, SPAWN_HOUSE_COLLIDER);
  }

  private isQuestSignHit(target: { x: number; y: number }): boolean {
    return distance(target.x, target.y, QUEST_SIGN.x, QUEST_SIGN.y) <= QUEST_SIGN.radius;
  }

  private resolveStructureCollision(
    entity: CollisionEntity,
    structure: { x: number; y: number; width: number; height: number }
  ): void {
    const left = structure.x - structure.width / 2;
    const right = structure.x + structure.width / 2;
    const top = structure.y - structure.height / 2;
    const bottom = structure.y + structure.height / 2;
    const closestX = clamp(entity.x, left, right);
    const closestY = clamp(entity.y, top, bottom);
    const offsetX = entity.x - closestX;
    const offsetY = entity.y - closestY;

    if (offsetX === 0 && offsetY === 0) {
      const escapeLeft = Math.abs(entity.x - left);
      const escapeRight = Math.abs(right - entity.x);
      const escapeTop = Math.abs(entity.y - top);
      const escapeBottom = Math.abs(bottom - entity.y);
      const smallestEscape = Math.min(escapeLeft, escapeRight, escapeTop, escapeBottom);

      if (smallestEscape === escapeLeft) {
        entity.x = left - entity.radius;
      } else if (smallestEscape === escapeRight) {
        entity.x = right + entity.radius;
      } else if (smallestEscape === escapeTop) {
        entity.y = top - entity.radius;
      } else {
        entity.y = bottom + entity.radius;
      }
      return;
    }

    const currentDistance = Math.hypot(offsetX, offsetY);
    if (currentDistance >= entity.radius || currentDistance === 0) {
      return;
    }

    const overlap = entity.radius - currentDistance;
    entity.x += (offsetX / currentDistance) * overlap;
    entity.y += (offsetY / currentDistance) * overlap;
  }
}
