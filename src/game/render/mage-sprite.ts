import type { PendingSpellCast } from "../app-types.js";
import type { EnemyEntity } from "../types.js";
import { getFacingDirection } from "../state-helpers.js";
import { clamp } from "../utils.js";

export const MAGE_SPRITE_CELL_SIZE = 128;
export const MAGE_SPRITE_FRAMES = 30;
export const MAGE_SPRITE_ANCHOR = Object.freeze({ x:64, y:116 });

/** Cast direction comes from the real pending spell, rather than the entire attack cooldown. */
export function getMageSpriteFrame(enemy: EnemyEntity, timestamp: number, moving: boolean, cast?: PendingSpellCast): { frame:number; mirror:boolean } {
  const direction=cast?.direction ?? enemy.dashDirection;
  const facing=getFacingDirection(direction.x || direction.y ? Math.atan2(direction.y,direction.x) : Math.PI/2);
  const bank=facing==="up" ? 20 : facing==="down" ? 0 : 10;
  const mirror=facing==="left";
  if(enemy.hurtTimer>0) return {frame:bank+9,mirror};
  if(cast && cast.remaining>0) {
    const progress=clamp(1-cast.remaining/Math.max(cast.duration,0.001),0,1);
    return {frame:bank+6+Math.min(2,Math.floor(progress*3)),mirror};
  }
  const time=Math.max(0,timestamp+enemy.id*71);
  return {frame:bank+(moving ? 2+Math.floor(time/120)%4 : Math.floor(time/240)%2),mirror};
}

export class MageSpriteRenderer {
  private readonly image: HTMLImageElement | null;
  private loaded=false;
  private readonly motion=new WeakMap<EnemyEntity,{ x:number; y:number; timestamp:number; movingUntil:number }>();

  constructor() {
    this.image=typeof Image==="undefined" ? null : new Image();
    if(!this.image) return;
    this.image.onload=()=>{
      this.loaded=this.image?.naturalWidth===MAGE_SPRITE_CELL_SIZE*MAGE_SPRITE_FRAMES && this.image?.naturalHeight===MAGE_SPRITE_CELL_SIZE;
    };
    this.image.onerror=()=>{this.loaded=false;};
    this.image.src="/assets/enemies/red-mage.png";
  }

  draw(ctx: CanvasRenderingContext2D, enemy: EnemyEntity, x:number, groundY:number, radius:number, timestamp:number, cast?:PendingSpellCast): boolean {
    if(!this.loaded || !this.image) return false;
    const previous=this.motion.get(enemy);
    const advanced=previous && timestamp>previous.timestamp && timestamp-previous.timestamp<500;
    const displaced=advanced && Math.hypot(enemy.x-previous.x,enemy.y-previous.y)>0.0001;
    const movingUntil=displaced ? timestamp+140 : previous && timestamp>=previous.timestamp ? previous.movingUntil : 0;
    this.motion.set(enemy,{x:enemy.x,y:enemy.y,timestamp,movingUntil});
    const {frame,mirror}=getMageSpriteFrame(enemy,timestamp,timestamp<movingUntil,cast);
    const scale=radius*3.3/102;
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.translate(Math.round(x),Math.round(groundY));
    if(mirror) ctx.scale(-1,1);
    if(enemy.hurtTimer>0) ctx.filter="brightness(1.4)";
    ctx.drawImage(this.image,frame*MAGE_SPRITE_CELL_SIZE,0,MAGE_SPRITE_CELL_SIZE,MAGE_SPRITE_CELL_SIZE,
      -MAGE_SPRITE_ANCHOR.x*scale,-MAGE_SPRITE_ANCHOR.y*scale,MAGE_SPRITE_CELL_SIZE*scale,MAGE_SPRITE_CELL_SIZE*scale);
    ctx.restore();
    return true;
  }
}
