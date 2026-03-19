import { PIXELS_PER_METER } from "../../constants.js";
import { Mage } from "../../enemies/index.js";
import { getSpellPalette } from "../../state-helpers.js";
import { WorldRenderLayerBase } from "../base-layer.js";

export class EffectsLayer extends WorldRenderLayerBase {
  drawSpellCasts(): void {
    for (const cast of this.pendingSpellCasts) {
      const source = this.state.resolveSpellCastSource(cast);
      if (!source) {
        continue;
      }

      const palette = getSpellPalette(cast.element);
      const progress = 1 - cast.remaining / cast.duration;
      const x = source.x * PIXELS_PER_METER;
      const y = source.y * PIXELS_PER_METER;
      const chargeRadius = (source.radius + 0.18 + progress * 0.24) * PIXELS_PER_METER;

      this.ctx.save();
      this.ctx.globalAlpha = 0.5 + progress * 0.32;
      this.ctx.strokeStyle = palette.glow;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, chargeRadius, progress * Math.PI * 0.9, progress * Math.PI * 0.9 + Math.PI * 1.35);
      this.ctx.stroke();

      for (let spark = 0; spark < 4; spark += 1) {
        const angle = this.lastTimestamp / 140 + progress * 5 + spark * (Math.PI / 2);
        const px = x + Math.cos(angle) * chargeRadius;
        const py = y + Math.sin(angle) * chargeRadius * 0.76;
        this.ctx.fillStyle = spark % 2 === 0 ? palette.core : palette.mid;
        this.ctx.fillRect(px - 2, py - 2, 4, 4);
      }

      this.ctx.restore();
    }
  }

  drawParticles(): void {
    for (const particle of this.particles) {
      const alpha = particle.maxLife > 0 ? particle.life / particle.maxLife : 0;
      const size = particle.size * PIXELS_PER_METER;
      const x = particle.x * PIXELS_PER_METER;
      const y = particle.y * PIXELS_PER_METER;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.shadowColor = particle.glow;
      this.ctx.shadowBlur = size * 2.4;

      if (particle.shape === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
      }

      this.ctx.restore();
    }
  }

  drawBurnEffects(): void {
    for (const effect of this.burnEffects) {
      if (!this.isBurnEffectActive(effect)) {
        continue;
      }

      const target = effect.target;
      const x = target.x * PIXELS_PER_METER;
      const y = target.y * PIXELS_PER_METER;
      const radius = target.radius * PIXELS_PER_METER;
      const flicker = 1 + Math.sin(this.lastTimestamp / 120 + effect.id) * 0.08;
      const flameWidth = radius * (effect.targetType === "breakable" ? 0.8 : 0.68) * flicker;
      const flameHeight = radius * (effect.targetType === "breakable" ? 1.5 : 1.26) * flicker;
      const baseY = y + radius * (effect.targetType === "breakable" ? 0.02 : 0.08);

      this.ctx.save();
      this.ctx.globalCompositeOperation = "lighter";

      const aura = this.ctx.createRadialGradient(x, baseY - flameHeight * 0.1, radius * 0.16, x, baseY, radius * 1.45);
      aura.addColorStop(0, "rgba(255, 247, 188, 0.22)");
      aura.addColorStop(0.45, "rgba(255, 131, 58, 0.26)");
      aura.addColorStop(1, "rgba(255, 78, 31, 0)");
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(x, baseY, radius * 1.45, 0, Math.PI * 2);
      this.ctx.fill();

      for (let flame = 0; flame < 3; flame += 1) {
        const sway = Math.sin(this.lastTimestamp / 140 + effect.id * 0.4 + flame * 1.6) * flameWidth * 0.16;
        const flameX = x + (flame - 1) * flameWidth * 0.58 + sway;
        const flameY = baseY - flameHeight * (0.12 + flame * 0.08);
        const flameGradient = this.ctx.createRadialGradient(
          flameX,
          flameY - flameHeight * 0.32,
          flameWidth * 0.08,
          flameX,
          flameY,
          flameHeight * 0.78
        );
        flameGradient.addColorStop(0, "rgba(255, 248, 215, 0.95)");
        flameGradient.addColorStop(0.3, "rgba(255, 184, 80, 0.88)");
        flameGradient.addColorStop(0.72, "rgba(255, 95, 44, 0.8)");
        flameGradient.addColorStop(1, "rgba(152, 28, 16, 0)");
        this.ctx.fillStyle = flameGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(flameX, flameY, flameWidth * 0.46, flameHeight * 0.72, 0, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  drawPlayerAuras(): void {
    for (const effect of this.playerAuraEffects) {
      if (effect.kind !== "levelUp") {
        continue;
      }

      const progress = 1 - effect.remaining / effect.duration;
      const alpha = 1 - progress;
      const x = this.player.x * PIXELS_PER_METER;
      const y = this.player.y * PIXELS_PER_METER;
      const radius = (this.player.radius + 0.28 + progress * 0.95) * PIXELS_PER_METER;

      this.ctx.save();
      this.ctx.globalAlpha = alpha * 0.86;
      this.ctx.strokeStyle = "#78dc88";
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y + 2, radius, radius * 0.54, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.strokeStyle = "rgba(214, 255, 195, 0.82)";
      this.ctx.lineWidth = 2.2;
      this.ctx.beginPath();
      this.ctx.arc(x, y - radius * 0.1, radius * 0.72, progress * Math.PI * 1.2, progress * Math.PI * 1.2 + Math.PI);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  drawEnemyDeathEffects(): void {
    for (const effect of this.enemyDeathEffects) {
      const progress = 1 - effect.remaining / effect.duration;
      const alpha = 1 - progress;
      const x = effect.x * PIXELS_PER_METER;
      const y = effect.y * PIXELS_PER_METER;
      const radius = effect.radius * PIXELS_PER_METER;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;

      if (effect.kind === Mage.kind) {
        const robeGradient = this.ctx.createLinearGradient(0, y - radius, 0, y + radius);
        robeGradient.addColorStop(0, "#79d3ff");
        robeGradient.addColorStop(1, "#1a468e");
        this.ctx.fillStyle = robeGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - radius * (0.92 - progress * 0.35));
        this.ctx.lineTo(x + radius * (0.72 - progress * 0.28), y + radius * (0.94 + progress * 0.1));
        this.ctx.lineTo(x - radius * (0.72 - progress * 0.28), y + radius * (0.94 + progress * 0.1));
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = "rgba(130, 224, 255, 0.7)";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * (0.5 + progress * 0.65), 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        const puddleGradient = this.ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius * (0.8 + progress * 0.25));
        puddleGradient.addColorStop(0, "#bcff9a");
        puddleGradient.addColorStop(1, "#2d7f39");
        this.ctx.fillStyle = puddleGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(
          x,
          y + radius * 0.45,
          radius * (1 + progress * 0.45),
          radius * Math.max(0.16, 0.52 - progress * 0.26),
          0,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  drawProjectiles(): void {
    for (const projectile of this.projectiles) {
      const x = projectile.x * PIXELS_PER_METER;
      const y = projectile.y * PIXELS_PER_METER;
      const radius = projectile.radius * PIXELS_PER_METER;
      const tailX = x - projectile.direction.x * radius * 1.9;
      const tailY = y - projectile.direction.y * radius * 1.9;

      const isWater = projectile.element === "water";
      this.ctx.fillStyle = isWater ? "rgba(103, 205, 255, 0.16)" : "rgba(255, 122, 59, 0.16)";
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 1.7, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = isWater ? "rgba(104, 191, 255, 0.42)" : "rgba(255, 143, 61, 0.44)";
      this.ctx.lineWidth = radius * 0.9;
      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();

      const gradient = this.ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
      if (isWater) {
        gradient.addColorStop(0, "#ecfbff");
        gradient.addColorStop(0.5, "#64cfff");
        gradient.addColorStop(1, "#1c63c4");
      } else {
        gradient.addColorStop(0, "#ffe6b0");
        gradient.addColorStop(0.5, "#ff7033");
        gradient.addColorStop(1, "#a11c15");
      }
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = isWater ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 241, 208, 0.72)";
      this.ctx.beginPath();
      this.ctx.arc(x - radius * 0.28, y - radius * 0.3, radius * 0.24, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawFloatingTexts(): void {
    this.ctx.save();
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.font = '700 18px "Palatino Linotype", Georgia, serif';

    for (const text of this.floatingTexts) {
      const alpha = text.maxLife > 0 ? text.life / text.maxLife : 0;
      const x = text.x * PIXELS_PER_METER;
      const y = text.y * PIXELS_PER_METER;

      this.ctx.globalAlpha = alpha;
      this.ctx.shadowColor = text.glow;
      this.ctx.shadowBlur = 10;
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = "rgba(49, 10, 10, 0.78)";
      this.ctx.strokeText(text.text, x, y);
      this.ctx.fillStyle = text.color;
      this.ctx.fillText(text.text, x, y);
    }

    this.ctx.restore();
  }

  private isBurnEffectActive(effect: WorldRenderLayerBase["burnEffects"][number]): boolean {
    if (effect.targetType === "enemy") {
      return !effect.target.dead && effect.target.hp > 0;
    }

    return effect.target.hp > 0;
  }
}
