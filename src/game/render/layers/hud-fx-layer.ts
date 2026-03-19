import { PIXELS_PER_METER } from "../../constants.js";
import { hexToRgba } from "../../day-night.js";
import { WorldRenderLayerBase } from "../base-layer.js";

export class HudFxLayer extends WorldRenderLayerBase {
  drawAimIndicator(): void {
    const x = this.player.x * PIXELS_PER_METER;
    const y = this.player.y * PIXELS_PER_METER;
    const aimX = x + Math.cos(this.player.facingAngle) * PIXELS_PER_METER * 1.35;
    const aimY = y + Math.sin(this.player.facingAngle) * PIXELS_PER_METER * 1.35;

    this.ctx.strokeStyle = "rgba(255, 240, 190, 0.68)";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(aimX, aimY);
    this.ctx.stroke();

    this.ctx.fillStyle = "rgba(255, 238, 188, 0.95)";
    this.ctx.beginPath();
    this.ctx.arc(aimX, aimY, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawScreenEffects(): void {
    this.ctx.save();

    const atmosphere = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    atmosphere.addColorStop(0, hexToRgba(this.dayNight.atmosphereTop, this.dayNight.atmosphereAlpha));
    atmosphere.addColorStop(0.56, hexToRgba(this.dayNight.atmosphereBottom, this.dayNight.atmosphereAlpha * 0.92));
    atmosphere.addColorStop(1, hexToRgba(this.dayNight.atmosphereBottom, this.dayNight.atmosphereAlpha * 0.24));
    this.ctx.fillStyle = atmosphere;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const sunlight = this.ctx.createRadialGradient(
      this.canvas.width * this.dayNight.celestialX,
      this.canvas.height * this.dayNight.celestialY,
      0,
      this.canvas.width * this.dayNight.celestialX,
      this.canvas.height * this.dayNight.celestialY,
      this.canvas.width * this.dayNight.celestialRadius
    );
    sunlight.addColorStop(0, hexToRgba(this.dayNight.celestialColor, this.dayNight.celestialAlpha));
    sunlight.addColorStop(0.45, hexToRgba(this.dayNight.celestialColor, this.dayNight.celestialAlpha * 0.34));
    sunlight.addColorStop(1, hexToRgba(this.dayNight.celestialColor, 0));
    this.ctx.fillStyle = sunlight;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = hexToRgba(this.dayNight.tintColor, this.dayNight.tintAlpha);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = hexToRgba(this.dayNight.shadowColor, this.dayNight.shadowAlpha * (this.dayNight.isNight ? 0.72 : 0.42));
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const vignette = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.height * 0.2,
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width * 0.68
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(0.68, hexToRgba(this.dayNight.shadowColor, this.dayNight.vignetteAlpha * 0.42));
    vignette.addColorStop(1, hexToRgba(this.dayNight.shadowColor, this.dayNight.vignetteAlpha));
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }
}
