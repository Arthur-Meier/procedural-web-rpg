import { PIXELS_PER_METER, PLAYER_ATTACK_RANGE, PLAYER_ATTACK_SWING_TIME } from "../../constants.js";
import { Mage } from "../../enemies/index.js";
import { getFacingDirection } from "../../state-helpers.js";
import { clamp, distance, lerp } from "../../utils.js";
import { WorldRenderLayerBase } from "../base-layer.js";
export class EntityLayer extends WorldRenderLayerBase {
    drawEnemies() {
        for (const enemy of this.enemies) {
            const x = enemy.x * PIXELS_PER_METER;
            const y = enemy.y * PIXELS_PER_METER;
            const radius = enemy.radius * PIXELS_PER_METER;
            if (enemy.kind === Mage.kind) {
                this.drawMageEnemy(enemy, x, y, radius);
            }
            else {
                this.drawSlimeEnemy(enemy, x, y, radius);
            }
            if (enemy.hp < enemy.maxHp || distance(enemy.x, enemy.y, this.player.x, this.player.y) < 3.2) {
                this.drawBar(enemy.x, enemy.y - enemy.radius - 0.42, enemy.hp / enemy.maxHp, "#7cff91");
            }
        }
    }
    drawPlayer() {
        const x = this.player.x * PIXELS_PER_METER;
        const y = this.player.y * PIXELS_PER_METER;
        const radius = this.player.radius * PIXELS_PER_METER;
        const facing = getFacingDirection(this.player.facingAngle);
        const mirror = facing === "left" ? -1 : 1;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + radius * 1.3, radius * 0.85, radius * 0.42, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.save();
        this.ctx.translate(x, y);
        if (facing === "left" || facing === "right") {
            this.ctx.scale(mirror, 1);
        }
        const capeGradient = this.ctx.createLinearGradient(0, 0, 0, radius * 1.4);
        capeGradient.addColorStop(0, "#7e1f1d");
        capeGradient.addColorStop(1, "#3b0d0f");
        this.ctx.fillStyle = "#523421";
        this.ctx.beginPath();
        this.ctx.ellipse(-radius * 0.24, radius * 0.9, radius * 0.18, radius * 0.28, 0, 0, Math.PI * 2);
        this.ctx.ellipse(radius * 0.24, radius * 0.9, radius * 0.18, radius * 0.28, 0, 0, Math.PI * 2);
        this.ctx.fill();
        if (facing !== "up") {
            this.ctx.fillStyle = capeGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(-radius * 0.58, radius * 0.08);
            this.ctx.quadraticCurveTo(-radius * 0.8, radius * 0.88, -radius * 0.28, radius * 1.28);
            this.ctx.lineTo(radius * 0.28, radius * 1.28);
            this.ctx.quadraticCurveTo(radius * 0.8, radius * 0.88, radius * 0.58, radius * 0.08);
            this.ctx.closePath();
            this.ctx.fill();
        }
        const armorGradient = this.ctx.createLinearGradient(0, -radius * 0.74, 0, radius * 1.02);
        armorGradient.addColorStop(0, "#4f7db2");
        armorGradient.addColorStop(0.55, "#294d7a");
        armorGradient.addColorStop(1, "#1d2c45");
        if (facing === "left" || facing === "right") {
            this.ctx.fillStyle = armorGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, radius * 0.18, radius * 0.54, radius * 0.96, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#d8b569";
            this.ctx.fillRect(-radius * 0.34, radius * 0.34, radius * 0.7, radius * 0.13);
            this.ctx.fillStyle = this.player.invulnerability > 0 ? "#ffe5c8" : "#f6e2c8";
            this.ctx.beginPath();
            this.ctx.ellipse(0, -radius * 0.72, radius * 0.34, radius * 0.48, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#5e3c24";
            this.ctx.beginPath();
            this.ctx.arc(0, -radius * 0.83, radius * 0.36, Math.PI, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillRect(-radius * 0.28, -radius * 0.88, radius * 0.56, radius * 0.12);
            this.ctx.fillStyle = "#f8f0d0";
            this.ctx.fillRect(radius * 0.06, -radius * 0.78, radius * 0.12, radius * 0.08);
            this.ctx.fillStyle = this.player.invulnerability > 0 ? "#ffe1c2" : "#f6dcbc";
            this.ctx.beginPath();
            this.ctx.ellipse(radius * 0.46, radius * 0.06, radius * 0.12, radius * 0.24, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        else {
            this.ctx.fillStyle = armorGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, radius * 0.16, radius * 0.72, radius * 0.96, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#d8b569";
            this.ctx.fillRect(-radius * 0.46, radius * 0.34, radius * 0.92, radius * 0.14);
            if (facing === "down") {
                this.ctx.fillStyle = "#ecd8aa";
                this.ctx.beginPath();
                this.ctx.moveTo(0, -radius * 0.18);
                this.ctx.lineTo(radius * 0.16, radius * 0.08);
                this.ctx.lineTo(0, radius * 0.22);
                this.ctx.lineTo(-radius * 0.16, radius * 0.08);
                this.ctx.closePath();
                this.ctx.fill();
            }
            this.ctx.fillStyle = this.player.invulnerability > 0 ? "#ffe5c8" : "#f6e2c8";
            this.ctx.beginPath();
            this.ctx.arc(0, -radius * 0.74, radius * 0.46, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#5e3c24";
            if (facing === "down") {
                this.ctx.beginPath();
                this.ctx.arc(0, -radius * 0.84, radius * 0.48, Math.PI, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillRect(-radius * 0.42, -radius * 0.9, radius * 0.84, radius * 0.12);
                this.ctx.fillStyle = "#1f281d";
                this.ctx.beginPath();
                this.ctx.arc(-radius * 0.14, -radius * 0.76, radius * 0.05, 0, Math.PI * 2);
                this.ctx.arc(radius * 0.14, -radius * 0.76, radius * 0.05, 0, Math.PI * 2);
                this.ctx.fill();
            }
            else {
                this.ctx.beginPath();
                this.ctx.arc(0, -radius * 0.88, radius * 0.48, Math.PI, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillRect(-radius * 0.42, -radius * 0.92, radius * 0.84, radius * 0.16);
            }
        }
        if (this.player.swingVisualTimer <= 0) {
            const swordX = radius * 0.76;
            const swordTilt = facing === "up" ? -radius * 0.9 : facing === "down" ? -radius * 0.72 : -radius * 0.62;
            this.ctx.fillStyle = "#5f432e";
            this.ctx.fillRect(swordX - radius * 0.06, -radius * 0.08, radius * 0.12, radius * 0.56);
            this.ctx.fillStyle = "#c9d4dc";
            this.ctx.beginPath();
            this.ctx.moveTo(swordX - radius * 0.12, swordTilt);
            this.ctx.lineTo(swordX, -radius * 0.02);
            this.ctx.lineTo(swordX + radius * 0.12, swordTilt);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = "#eadf88";
            this.ctx.fillRect(swordX - radius * 0.18, -radius * 0.04, radius * 0.36, radius * 0.08);
        }
        this.ctx.restore();
        if (this.player.swingVisualTimer > 0) {
            this.drawSwordSwingEffect(x, y, radius);
        }
    }
    drawSlimeEnemy(enemy, x, y, radius) {
        const wobble = Math.sin(this.lastTimestamp / 140 + enemy.id) * 0.06;
        const dashStretch = enemy.dashTimer > 0 ? 1.24 : 1 + wobble;
        const dashSquash = enemy.dashTimer > 0 ? 0.72 : 1 - wobble * 0.35;
        const facing = enemy.dashTimer > 0 ? Math.atan2(enemy.dashDirection.y, enemy.dashDirection.x) : 0;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + radius * 1.25, radius * 1.15, radius * 0.42, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(facing);
        this.ctx.scale(dashStretch, dashSquash);
        const slimeGradient = this.ctx.createLinearGradient(0, -radius * 1.2, 0, radius);
        slimeGradient.addColorStop(0, enemy.hurtTimer > 0 ? "#d8ff9f" : "#b0ff98");
        slimeGradient.addColorStop(0.45, enemy.dashTimer > 0 ? "#88f77f" : "#73db66");
        slimeGradient.addColorStop(1, "#41a64a");
        this.ctx.fillStyle = slimeGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(-radius * 0.98, radius * 0.18);
        this.ctx.quadraticCurveTo(-radius * 0.92, -radius * 0.54, -radius * 0.3, -radius * 0.94);
        this.ctx.quadraticCurveTo(0, -radius * 1.18, radius * 0.32, -radius * 0.96);
        this.ctx.quadraticCurveTo(radius * 0.95, -radius * 0.56, radius * 0.98, radius * 0.18);
        this.ctx.quadraticCurveTo(radius * 0.58, radius * 1.04, 0, radius * 0.86);
        this.ctx.quadraticCurveTo(-radius * 0.58, radius * 1.04, -radius * 0.98, radius * 0.18);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        this.ctx.beginPath();
        this.ctx.ellipse(-radius * 0.2, -radius * 0.5, radius * 0.34, radius * 0.2, -0.4, 0, Math.PI * 2);
        this.ctx.fill();
        const eyeY = -radius * 0.12;
        const eyeX = radius * 0.32;
        this.ctx.strokeStyle = "#1d3521";
        this.ctx.fillStyle = "#162616";
        this.ctx.lineWidth = Math.max(1.5, radius * 0.1);
        if (enemy.dashTimer > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(-eyeX - radius * 0.08, eyeY + radius * 0.05);
            this.ctx.lineTo(-eyeX + radius * 0.08, eyeY - radius * 0.06);
            this.ctx.moveTo(eyeX - radius * 0.08, eyeY - radius * 0.06);
            this.ctx.lineTo(eyeX + radius * 0.08, eyeY + radius * 0.05);
            this.ctx.stroke();
        }
        else {
            this.ctx.beginPath();
            this.ctx.arc(-eyeX, eyeY, Math.max(1.4, radius * 0.14), 0, Math.PI * 2);
            this.ctx.arc(eyeX, eyeY, Math.max(1.4, radius * 0.14), 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.strokeStyle = "#214022";
        this.ctx.lineWidth = Math.max(1.4, radius * 0.1);
        this.ctx.beginPath();
        this.ctx.moveTo(-radius * 0.22, radius * 0.2);
        this.ctx.quadraticCurveTo(0, radius * 0.36, radius * 0.22, radius * 0.2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawMageEnemy(enemy, x, y, radius) {
        const breathing = 1 + Math.sin(this.lastTimestamp / 180 + enemy.id) * 0.04;
        const facingAngle = enemy.dashDirection.x || enemy.dashDirection.y ? Math.atan2(enemy.dashDirection.y, enemy.dashDirection.x) : Math.PI / 2;
        const facing = getFacingDirection(facingAngle);
        const mirror = facing === "left" ? -1 : 1;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + radius * 1.3, radius * 1.05, radius * 0.34, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.save();
        this.ctx.translate(x, y);
        if (facing === "left" || facing === "right") {
            this.ctx.scale(mirror * breathing, breathing);
        }
        else {
            this.ctx.scale(breathing, breathing);
        }
        const robeGradient = this.ctx.createLinearGradient(0, -radius * 1.2, 0, radius * 1.3);
        robeGradient.addColorStop(0, enemy.hurtTimer > 0 ? "#7fcfff" : "#58b8ff");
        robeGradient.addColorStop(0.55, "#2e7dc8");
        robeGradient.addColorStop(1, "#173d82");
        this.ctx.fillStyle = "#1c2540";
        this.ctx.beginPath();
        this.ctx.ellipse(-radius * 0.24, radius * 0.94, radius * 0.18, radius * 0.24, 0, 0, Math.PI * 2);
        this.ctx.ellipse(radius * 0.24, radius * 0.94, radius * 0.18, radius * 0.24, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = robeGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -radius * 1.08);
        this.ctx.lineTo(radius * 0.72, -radius * 0.24);
        this.ctx.lineTo(radius * 0.94, radius * 1.04);
        this.ctx.lineTo(-radius * 0.94, radius * 1.04);
        this.ctx.lineTo(-radius * 0.72, -radius * 0.24);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = "#11233d";
        this.ctx.fillRect(-radius * 0.42, radius * 0.14, radius * 0.84, radius * 0.08);
        if (facing === "left" || facing === "right") {
            this.ctx.fillStyle = "#d8edf8";
            this.ctx.beginPath();
            this.ctx.ellipse(0, -radius * 0.42, radius * 0.28, radius * 0.36, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#11233d";
            this.ctx.beginPath();
            this.ctx.arc(-radius * 0.02, -radius * 0.5, radius * 0.38, Math.PI, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillRect(-radius * 0.28, -radius * 0.52, radius * 0.34, radius * 0.12);
            this.ctx.fillStyle = "#f3fbff";
            this.ctx.beginPath();
            this.ctx.arc(radius * 0.08, -radius * 0.43, Math.max(1.4, radius * 0.07), 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#d8edf8";
            this.ctx.beginPath();
            this.ctx.ellipse(radius * 0.42, radius * 0.06, radius * 0.1, radius * 0.22, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        else if (facing === "down") {
            this.ctx.fillStyle = "#d8edf8";
            this.ctx.beginPath();
            this.ctx.arc(0, -radius * 0.38, radius * 0.34, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#11233d";
            this.ctx.beginPath();
            this.ctx.moveTo(-radius * 0.5, -radius * 0.28);
            this.ctx.quadraticCurveTo(0, -radius * 1.18, radius * 0.5, -radius * 0.28);
            this.ctx.lineTo(radius * 0.18, -radius * 0.54);
            this.ctx.lineTo(-radius * 0.18, -radius * 0.54);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = "#f3fbff";
            this.ctx.beginPath();
            this.ctx.arc(-radius * 0.14, -radius * 0.4, Math.max(1.4, radius * 0.07), 0, Math.PI * 2);
            this.ctx.arc(radius * 0.14, -radius * 0.4, Math.max(1.4, radius * 0.07), 0, Math.PI * 2);
            this.ctx.fill();
        }
        else {
            this.ctx.fillStyle = "#11233d";
            this.ctx.beginPath();
            this.ctx.arc(0, -radius * 0.44, radius * 0.42, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#2b4e7b";
            this.ctx.beginPath();
            this.ctx.moveTo(-radius * 0.2, -radius * 0.58);
            this.ctx.lineTo(0, -radius * 0.8);
            this.ctx.lineTo(radius * 0.2, -radius * 0.58);
            this.ctx.lineTo(0, -radius * 0.38);
            this.ctx.closePath();
            this.ctx.fill();
        }
        this.ctx.strokeStyle = "#7ee0ff";
        this.ctx.lineWidth = Math.max(2, radius * 0.12);
        this.ctx.beginPath();
        this.ctx.moveTo(radius * 0.56, -radius * 0.18);
        this.ctx.lineTo(radius * 1.02, -radius * 1.02);
        this.ctx.stroke();
        const orbGradient = this.ctx.createRadialGradient(radius * 1.02, -radius * 1.02, radius * 0.04, radius * 1.02, -radius * 1.02, radius * 0.26);
        orbGradient.addColorStop(0, "#effcff");
        orbGradient.addColorStop(0.5, "#6fd2ff");
        orbGradient.addColorStop(1, "#1f75d1");
        this.ctx.fillStyle = orbGradient;
        this.ctx.beginPath();
        this.ctx.arc(radius * 1.02, -radius * 1.02, radius * 0.22, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    drawSwordSwingEffect(x, y, radius) {
        const progress = clamp(1 - this.player.swingVisualTimer / PLAYER_ATTACK_SWING_TIME, 0, 1);
        const easedProgress = 1 - (1 - progress) * (1 - progress);
        const trailingProgress = Math.max(0, easedProgress - 0.24);
        const swingStart = this.player.facingAngle + Math.PI * 0.78;
        const swingEnd = this.player.facingAngle - Math.PI * 0.82;
        const trailAngle = lerp(swingStart, swingEnd, trailingProgress);
        const currentAngle = lerp(swingStart, swingEnd, easedProgress);
        const outerRadius = PLAYER_ATTACK_RANGE * PIXELS_PER_METER;
        const innerRadius = Math.max(radius * 1.08, outerRadius - radius * 0.96);
        const midRadius = (innerRadius + outerRadius) / 2;
        const dirX = Math.cos(currentAngle);
        const dirY = Math.sin(currentAngle);
        const perpX = -dirY;
        const perpY = dirX;
        const pommelDistance = radius * 0.32;
        const gripDistance = radius * 0.68;
        const guardDistance = radius * 0.98;
        const tipDistance = outerRadius - radius * 0.08;
        const pommelX = x + dirX * pommelDistance;
        const pommelY = y + dirY * pommelDistance;
        const guardX = x + dirX * guardDistance;
        const guardY = y + dirY * guardDistance;
        const gripX = x + dirX * gripDistance;
        const gripY = y + dirY * gripDistance;
        const tipX = x + dirX * tipDistance;
        const tipY = y + dirY * tipDistance;
        this.ctx.save();
        this.ctx.globalCompositeOperation = "lighter";
        this.ctx.shadowColor = "rgba(188, 232, 255, 0.55)";
        this.ctx.shadowBlur = radius * 0.82;
        const slashGradient = this.ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        slashGradient.addColorStop(0, "rgba(255, 239, 192, 0.02)");
        slashGradient.addColorStop(0.5, "rgba(187, 216, 240, 0.22)");
        slashGradient.addColorStop(0.82, "rgba(234, 246, 255, 0.78)");
        slashGradient.addColorStop(1, "rgba(160, 219, 255, 0.12)");
        this.ctx.fillStyle = slashGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, outerRadius, trailAngle, currentAngle, true);
        this.ctx.arc(x, y, innerRadius, currentAngle, trailAngle, false);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = "rgba(203, 231, 255, 0.38)";
        this.ctx.lineWidth = Math.max(10, radius * 0.34);
        this.ctx.lineCap = "round";
        this.ctx.beginPath();
        this.ctx.arc(x, y, midRadius, trailAngle, currentAngle, true);
        this.ctx.stroke();
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
        this.ctx.lineWidth = Math.max(4, radius * 0.14);
        this.ctx.beginPath();
        this.ctx.arc(x, y, outerRadius - radius * 0.08, trailAngle, currentAngle, true);
        this.ctx.stroke();
        const bladeGradient = this.ctx.createLinearGradient(guardX, guardY, tipX, tipY);
        bladeGradient.addColorStop(0, "#edf4fa");
        bladeGradient.addColorStop(0.55, "#c0d0dc");
        bladeGradient.addColorStop(1, "#ffffff");
        this.ctx.fillStyle = bladeGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(guardX + perpX * radius * 0.14, guardY + perpY * radius * 0.14);
        this.ctx.lineTo(tipX + perpX * radius * 0.045, tipY + perpY * radius * 0.045);
        this.ctx.lineTo(tipX + dirX * radius * 0.18, tipY + dirY * radius * 0.18);
        this.ctx.lineTo(tipX - perpX * radius * 0.045, tipY - perpY * radius * 0.045);
        this.ctx.lineTo(guardX - perpX * radius * 0.14, guardY - perpY * radius * 0.14);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = "rgba(146, 172, 190, 0.9)";
        this.ctx.lineWidth = Math.max(2, radius * 0.06);
        this.ctx.beginPath();
        this.ctx.moveTo(guardX + dirX * radius * 0.18, guardY + dirY * radius * 0.18);
        this.ctx.lineTo(tipX - dirX * radius * 0.18, tipY - dirY * radius * 0.18);
        this.ctx.stroke();
        this.ctx.strokeStyle = "#eed37c";
        this.ctx.lineWidth = Math.max(5, radius * 0.18);
        this.ctx.beginPath();
        this.ctx.moveTo(guardX + perpX * radius * 0.26, guardY + perpY * radius * 0.26);
        this.ctx.lineTo(guardX - perpX * radius * 0.26, guardY - perpY * radius * 0.26);
        this.ctx.stroke();
        this.ctx.strokeStyle = "#5c3922";
        this.ctx.lineWidth = Math.max(5, radius * 0.16);
        this.ctx.beginPath();
        this.ctx.moveTo(pommelX, pommelY);
        this.ctx.lineTo(gripX, gripY);
        this.ctx.stroke();
        this.ctx.fillStyle = "#f1da8c";
        this.ctx.beginPath();
        this.ctx.arc(pommelX, pommelY, radius * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
}
