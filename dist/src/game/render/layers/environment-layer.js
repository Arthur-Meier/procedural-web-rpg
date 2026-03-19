import { PIXELS_PER_METER } from "../../constants.js";
import { GUIDE_NPC, QUEST_SIGN, SPAWN_HOUSE, SPAWN_HOUSE_FOOTPRINT } from "../../game-config.js";
import { getFacingDirection } from "../../state-helpers.js";
import { angleBetween } from "../../utils.js";
import { WorldRenderLayerBase } from "../base-layer.js";
export class EnvironmentLayer extends WorldRenderLayerBase {
    drawSpawnHouse() {
        const x = SPAWN_HOUSE.x * PIXELS_PER_METER;
        const y = SPAWN_HOUSE.y * PIXELS_PER_METER;
        const width = SPAWN_HOUSE.width * PIXELS_PER_METER;
        const height = SPAWN_HOUSE.height * PIXELS_PER_METER;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const roofHeight = height * 0.58;
        const roofY = y - halfHeight - roofHeight * 0.42;
        const footprintX = SPAWN_HOUSE_FOOTPRINT.x * PIXELS_PER_METER;
        const footprintY = SPAWN_HOUSE_FOOTPRINT.y * PIXELS_PER_METER;
        const footprintWidth = SPAWN_HOUSE_FOOTPRINT.width * PIXELS_PER_METER;
        const footprintHeight = SPAWN_HOUSE_FOOTPRINT.height * PIXELS_PER_METER;
        const footprintLeft = footprintX - footprintWidth / 2;
        const footprintTop = footprintY - footprintHeight / 2;
        const wallInsetX = footprintWidth * 0.05;
        const wallInsetTop = footprintHeight * 0.08;
        const wallInsetBottom = footprintHeight * 0.07;
        const wallLeft = footprintLeft + wallInsetX;
        const wallTop = footprintTop + wallInsetTop;
        const wallWidth = footprintWidth - wallInsetX * 2;
        const wallHeight = footprintHeight - wallInsetTop - wallInsetBottom;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
        this.ctx.beginPath();
        this.ctx.ellipse(footprintX, footprintY + footprintHeight * 0.48, footprintWidth * 0.64, footprintHeight * 0.18, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "rgba(137, 102, 58, 0.28)";
        this.ctx.beginPath();
        this.ctx.roundRect(footprintX - 24, footprintY + footprintHeight * 0.46 - 2, 48, 16, 8);
        this.ctx.fill();
        const foundationGradient = this.ctx.createLinearGradient(footprintX, footprintTop, footprintX, footprintTop + footprintHeight);
        foundationGradient.addColorStop(0, "#75654b");
        foundationGradient.addColorStop(0.55, "#5a4a35");
        foundationGradient.addColorStop(1, "#3b2f22");
        this.ctx.fillStyle = foundationGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(footprintLeft, footprintTop, footprintWidth, footprintHeight, 12);
        this.ctx.fill();
        this.ctx.strokeStyle = "rgba(31, 22, 14, 0.52)";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.roundRect(footprintLeft, footprintTop, footprintWidth, footprintHeight, 12);
        this.ctx.stroke();
        const wallGradient = this.ctx.createLinearGradient(x, wallTop, x, wallTop + wallHeight);
        wallGradient.addColorStop(0, "#e2cca0");
        wallGradient.addColorStop(0.5, "#c69a62");
        wallGradient.addColorStop(1, "#9a6c40");
        this.ctx.fillStyle = wallGradient;
        this.ctx.fillRect(wallLeft, wallTop, wallWidth, wallHeight);
        this.ctx.fillStyle = "#6d4c2d";
        this.ctx.fillRect(wallLeft - 4, wallTop - 4, wallWidth + 8, 10);
        this.ctx.fillRect(wallLeft - 4, wallTop + wallHeight - 8, wallWidth + 8, 11);
        this.ctx.fillRect(wallLeft - 4, wallTop, 10, wallHeight);
        this.ctx.fillRect(wallLeft + wallWidth - 6, wallTop, 10, wallHeight);
        this.ctx.fillStyle = "rgba(255, 239, 202, 0.14)";
        this.ctx.fillRect(wallLeft + 10, wallTop + 8, wallWidth - 20, 7);
        this.ctx.fillStyle = "#6b5740";
        for (const stoneOffset of [-footprintWidth * 0.28, -footprintWidth * 0.08, footprintWidth * 0.12, footprintWidth * 0.32]) {
            this.ctx.fillRect(footprintX + stoneOffset - 9, footprintY + footprintHeight * 0.36, 18, 10);
        }
        this.ctx.fillStyle = "#8d5e35";
        this.ctx.fillRect(x - 17, wallTop + wallHeight * 0.52, 34, wallHeight * 0.34);
        this.ctx.fillStyle = "#c8a46a";
        this.ctx.fillRect(x - 13, wallTop + wallHeight * 0.56, 26, wallHeight * 0.29);
        this.ctx.fillStyle = "#6d4c2d";
        this.ctx.fillRect(x - 1, wallTop + wallHeight * 0.56, 2, wallHeight * 0.29);
        this.ctx.beginPath();
        this.ctx.arc(x + 9, wallTop + wallHeight * 0.7, 2.6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#6c5943";
        this.ctx.beginPath();
        this.ctx.roundRect(x - 22, footprintY + footprintHeight * 0.48, 44, 12, 6);
        this.ctx.fill();
        const windowPositions = [-wallWidth * 0.24, wallWidth * 0.24];
        for (const offset of windowPositions) {
            this.ctx.fillStyle = "#6b4527";
            this.ctx.fillRect(x + offset - 15, wallTop + 16, 30, 26);
            this.ctx.fillStyle = "#8fd6ff";
            this.ctx.fillRect(x + offset - 11, wallTop + 20, 22, 18);
            this.ctx.fillStyle = "rgba(255, 245, 186, 0.26)";
            this.ctx.fillRect(x + offset - 11, wallTop + 20, 22, 6);
            this.ctx.fillStyle = "#6b4527";
            this.ctx.fillRect(x + offset - 1, wallTop + 20, 2, 18);
            this.ctx.fillRect(x + offset - 11, wallTop + 28, 22, 2);
        }
        this.ctx.fillStyle = "#7d5532";
        this.ctx.fillRect(x + halfWidth * 0.24, roofY - 18, 14, 34);
        this.ctx.fillStyle = "#d5c2a4";
        this.ctx.fillRect(x + halfWidth * 0.24 + 2, roofY - 14, 10, 24);
        this.ctx.fillStyle = "#7b3f2d";
        this.ctx.beginPath();
        this.ctx.moveTo(x - halfWidth * 0.62, y - halfHeight * 0.18);
        this.ctx.lineTo(x, roofY - roofHeight * 0.5);
        this.ctx.lineTo(x + halfWidth * 0.62, y - halfHeight * 0.18);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = "#94513a";
        this.ctx.beginPath();
        this.ctx.moveTo(x - halfWidth * 0.54, y - halfHeight * 0.04);
        this.ctx.lineTo(x, roofY - roofHeight * 0.34);
        this.ctx.lineTo(x + halfWidth * 0.54, y - halfHeight * 0.04);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = "rgba(255, 236, 188, 0.16)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, roofY - roofHeight * 0.38);
        this.ctx.lineTo(x - halfWidth * 0.42, y - halfHeight * 0.08);
        this.ctx.moveTo(x, roofY - roofHeight * 0.38);
        this.ctx.lineTo(x + halfWidth * 0.42, y - halfHeight * 0.08);
        this.ctx.stroke();
        this.ctx.strokeStyle = "rgba(66, 45, 27, 0.5)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(footprintLeft + 10, footprintY + footprintHeight * 0.18);
        this.ctx.lineTo(footprintLeft + footprintWidth - 10, footprintY + footprintHeight * 0.18);
        this.ctx.stroke();
    }
    drawGuideNpc() {
        const x = GUIDE_NPC.x * PIXELS_PER_METER;
        const y = GUIDE_NPC.y * PIXELS_PER_METER;
        const radius = GUIDE_NPC.radius * PIXELS_PER_METER;
        const facingAngle = this.player ? angleBetween(GUIDE_NPC.x, GUIDE_NPC.y, this.player.x, this.player.y) : 0;
        const facing = getFacingDirection(facingAngle);
        const mirror = facing === "left" ? -1 : 1;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + radius * 1.18, radius * 0.92, radius * 0.38, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.save();
        this.ctx.translate(x, y);
        if (facing === "left" || facing === "right") {
            this.ctx.scale(mirror, 1);
        }
        const cloakGradient = this.ctx.createLinearGradient(0, 0, 0, radius * 1.5);
        cloakGradient.addColorStop(0, "#3c6a54");
        cloakGradient.addColorStop(1, "#173224");
        this.ctx.fillStyle = "#57402b";
        this.ctx.beginPath();
        this.ctx.ellipse(-radius * 0.2, radius * 0.84, radius * 0.16, radius * 0.24, 0, 0, Math.PI * 2);
        this.ctx.ellipse(radius * 0.2, radius * 0.84, radius * 0.16, radius * 0.24, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = cloakGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(-radius * 0.54, radius * 0.06);
        this.ctx.quadraticCurveTo(-radius * 0.74, radius * 0.88, -radius * 0.22, radius * 1.18);
        this.ctx.lineTo(radius * 0.22, radius * 1.18);
        this.ctx.quadraticCurveTo(radius * 0.74, radius * 0.88, radius * 0.54, radius * 0.06);
        this.ctx.closePath();
        this.ctx.fill();
        const tunicGradient = this.ctx.createLinearGradient(0, -radius * 0.72, 0, radius);
        tunicGradient.addColorStop(0, "#6f8eb2");
        tunicGradient.addColorStop(1, "#2d4d70");
        this.ctx.fillStyle = tunicGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(0, radius * 0.14, radius * 0.6, radius * 0.9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#d8b569";
        this.ctx.fillRect(-radius * 0.38, radius * 0.32, radius * 0.76, radius * 0.1);
        this.ctx.fillStyle = "#f4dfbf";
        this.ctx.beginPath();
        this.ctx.arc(0, -radius * 0.66, radius * 0.38, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#5f3d27";
        this.ctx.beginPath();
        this.ctx.arc(0, -radius * 0.78, radius * 0.4, Math.PI, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(-radius * 0.34, -radius * 0.84, radius * 0.68, radius * 0.12);
        this.ctx.fillStyle = "#224131";
        this.ctx.beginPath();
        this.ctx.arc(-radius * 0.11, -radius * 0.67, radius * 0.04, 0, Math.PI * 2);
        this.ctx.arc(radius * 0.11, -radius * 0.67, radius * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#f2e4c1";
        this.ctx.beginPath();
        this.ctx.arc(radius * 0.42, radius * 0.02, radius * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        if (this.state.isNearGuideNpc()) {
            this.ctx.fillStyle = "rgba(24, 35, 28, 0.88)";
            this.ctx.strokeStyle = "rgba(255, 232, 172, 0.26)";
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(x - 34, y - radius * 2.4, 68, 28, 12);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.fillStyle = "#ffe5a3";
            this.ctx.font = '700 14px "Palatino Linotype", Georgia, serif';
            this.ctx.textAlign = "center";
            this.ctx.fillText("E", x, y - radius * 2.4 + 19);
        }
    }
    drawQuestSign() {
        const x = QUEST_SIGN.x * PIXELS_PER_METER;
        const y = QUEST_SIGN.y * PIXELS_PER_METER;
        const width = QUEST_SIGN.radius * PIXELS_PER_METER * 1.5;
        const height = QUEST_SIGN.radius * PIXELS_PER_METER * 1.18;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + height * 0.78, width * 0.58, height * 0.24, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#6e4729";
        this.ctx.fillRect(x - 4, y - 2, 8, height * 1.32);
        const boardGradient = this.ctx.createLinearGradient(x, y - height * 0.5, x, y + height * 0.44);
        boardGradient.addColorStop(0, "#d4b27a");
        boardGradient.addColorStop(1, "#9a6f41");
        this.ctx.fillStyle = boardGradient;
        this.ctx.fillRect(x - width * 0.52, y - height * 0.58, width * 1.04, height * 0.92);
        this.ctx.strokeStyle = "#6d4829";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - width * 0.52, y - height * 0.58, width * 1.04, height * 0.92);
        this.ctx.fillStyle = "#5e3d22";
        this.ctx.fillRect(x - width * 0.32, y - height * 0.22, width * 0.64, 3);
        this.ctx.fillRect(x - width * 0.32, y - height * 0.02, width * 0.64, 3);
        this.ctx.fillRect(x - width * 0.32, y + height * 0.18, width * 0.64, 3);
        this.ctx.fillStyle = "#fff1c7";
        this.ctx.font = '700 12px "Palatino Linotype", Georgia, serif';
        this.ctx.textAlign = "center";
        this.ctx.fillText("MISSOES", x, y - height * 0.76);
    }
    drawBreakables() {
        for (const chunk of this.world.getActiveChunks()) {
            for (const object of chunk.objects) {
                if (object.kind === "tree") {
                    this.drawTree(object);
                }
                else if (object.kind === "rock") {
                    this.drawRock(object);
                }
                else {
                    this.drawCrate(object);
                }
                if (object.hp < object.maxHp) {
                    this.drawBar(object.x, object.y - object.radius - 0.36, object.hp / object.maxHp, "#f0c95a");
                }
            }
        }
    }
    drawDrops() {
        for (const drop of this.drops) {
            const bob = Math.sin(drop.life * 4 + drop.id) * 5;
            const x = drop.x * PIXELS_PER_METER;
            const y = drop.y * PIXELS_PER_METER + bob;
            if (drop.kind === "gold") {
                this.drawGoldDropVisual(x, y);
                continue;
            }
            this.drawItemDropVisual(drop, x, y);
        }
    }
    drawTree(object) {
        const x = object.x * PIXELS_PER_METER;
        const y = object.y * PIXELS_PER_METER;
        const radius = object.radius * PIXELS_PER_METER;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 18, radius * 1.05, radius * 0.62, 0, 0, Math.PI * 2);
        this.ctx.fill();
        const barkGradient = this.ctx.createLinearGradient(x, y - radius * 0.8, x, y + radius);
        barkGradient.addColorStop(0, "#7c532f");
        barkGradient.addColorStop(1, "#4e2f18");
        this.ctx.fillStyle = barkGradient;
        this.ctx.fillRect(x - 10, y - 10, 20, 40);
        this.ctx.fillStyle = "#8d6438";
        this.ctx.fillRect(x - 2, y - 10, 4, 40);
        this.ctx.strokeStyle = "rgba(56, 32, 16, 0.45)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 16);
        this.ctx.lineTo(x - 12, y + 26);
        this.ctx.moveTo(x, y + 18);
        this.ctx.lineTo(x + 11, y + 28);
        this.ctx.stroke();
        this.ctx.fillStyle = "#447c3f";
        this.ctx.beginPath();
        this.ctx.arc(x, y - 24, radius * 0.9, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#59a950";
        this.ctx.beginPath();
        this.ctx.arc(x - 22, y - 8, radius * 0.68, 0, Math.PI * 2);
        this.ctx.arc(x + 20, y - 5, radius * 0.66, 0, Math.PI * 2);
        this.ctx.arc(x, y - 40, radius * 0.52, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#76c167";
        this.ctx.beginPath();
        this.ctx.arc(x - 8, y - 34, radius * 0.28, 0, Math.PI * 2);
        this.ctx.arc(x + 11, y - 26, radius * 0.22, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "rgba(197, 242, 168, 0.18)";
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.22, y - radius * 1.02, radius * 0.42, 0, Math.PI * 2);
        this.ctx.fill();
    }
    drawRock(object) {
        const x = object.x * PIXELS_PER_METER;
        const y = object.y * PIXELS_PER_METER;
        const radius = object.radius * PIXELS_PER_METER;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 18, radius, radius * 0.46, 0, 0, Math.PI * 2);
        this.ctx.fill();
        const stoneGradient = this.ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
        stoneGradient.addColorStop(0, "#b7c1c7");
        stoneGradient.addColorStop(0.5, "#7f8b96");
        stoneGradient.addColorStop(1, "#5e6a74");
        this.ctx.fillStyle = stoneGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(x - radius * 0.9, y + radius * 0.24);
        this.ctx.lineTo(x - radius * 0.54, y - radius * 0.84);
        this.ctx.lineTo(x + radius * 0.18, y - radius * 0.96);
        this.ctx.lineTo(x + radius * 0.88, y - radius * 0.28);
        this.ctx.lineTo(x + radius * 0.64, y + radius * 0.72);
        this.ctx.lineTo(x - radius * 0.18, y + radius * 0.82);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        this.ctx.beginPath();
        this.ctx.moveTo(x - radius * 0.28, y - radius * 0.52);
        this.ctx.lineTo(x + radius * 0.16, y - radius * 0.68);
        this.ctx.lineTo(x + radius * 0.34, y - radius * 0.3);
        this.ctx.lineTo(x - radius * 0.08, y - radius * 0.18);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = "rgba(54, 68, 78, 0.45)";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - radius * 0.2, y - radius * 0.1);
        this.ctx.lineTo(x + radius * 0.08, y + radius * 0.38);
        this.ctx.moveTo(x + radius * 0.18, y - radius * 0.24);
        this.ctx.lineTo(x + radius * 0.5, y + radius * 0.12);
        this.ctx.stroke();
        this.ctx.fillStyle = "rgba(96, 137, 96, 0.18)";
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.16, y + radius * 0.2, radius * 0.18, 0, Math.PI * 2);
        this.ctx.fill();
    }
    drawCrate(object) {
        const x = object.x * PIXELS_PER_METER;
        const y = object.y * PIXELS_PER_METER;
        const size = object.radius * PIXELS_PER_METER * 1.6;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
        this.ctx.fillRect(x - size / 2, y + size / 2 - 8, size, 14);
        this.ctx.fillStyle = "#aa6e3c";
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
        this.ctx.fillStyle = "#c78849";
        this.ctx.fillRect(x - size / 2 + 2, y - size / 2 + 4, size - 4, 7);
        this.ctx.fillStyle = "#996131";
        this.ctx.fillRect(x - size / 2 + 4, y - size * 0.1, size - 8, size * 0.18);
        this.ctx.strokeStyle = "#6d421f";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        this.ctx.beginPath();
        this.ctx.moveTo(x - size / 2, y - size / 2);
        this.ctx.lineTo(x + size / 2, y + size / 2);
        this.ctx.moveTo(x + size / 2, y - size / 2);
        this.ctx.lineTo(x - size / 2, y + size / 2);
        this.ctx.stroke();
        this.ctx.fillStyle = "#d2a45f";
        this.ctx.fillRect(x - size * 0.08, y - size * 0.5, size * 0.16, size);
        this.ctx.fillStyle = "#ead7a0";
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.24, y - size * 0.18, 2.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.24, y + size * 0.18, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    drawGoldDropVisual(x, y) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 11, 12, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        const coinGradient = this.ctx.createLinearGradient(x, y - 10, x, y + 10);
        coinGradient.addColorStop(0, "#fff0a4");
        coinGradient.addColorStop(0.5, "#f6d159");
        coinGradient.addColorStop(1, "#c18e20");
        this.ctx.fillStyle = coinGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = "#b17816";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 7, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        this.ctx.fillRect(x - 2, y - 6, 3, 9);
    }
    drawItemDropVisual(drop, x, y) {
        if (drop.itemId === "wood") {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
            this.ctx.beginPath();
            this.ctx.ellipse(x, y + 11, 13, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = "#8f5a32";
            this.ctx.fillRect(x - 11, y - 3, 18, 7);
            this.ctx.fillRect(x - 6, y - 8, 18, 7);
            this.ctx.fillStyle = "#d6a36d";
            this.ctx.beginPath();
            this.ctx.arc(x - 11, y + 0.5, 3.5, 0, Math.PI * 2);
            this.ctx.arc(x - 6, y - 4.5, 3.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = "#5a3418";
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 1, y - 5);
            this.ctx.lineTo(x + 1, y + 4);
            this.ctx.stroke();
            return;
        }
        if (drop.itemId === "stone") {
            const stoneGradient = this.ctx.createLinearGradient(x - 10, y - 10, x + 10, y + 10);
            stoneGradient.addColorStop(0, "#c2cad0");
            stoneGradient.addColorStop(1, "#74808a");
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
            this.ctx.beginPath();
            this.ctx.ellipse(x, y + 10, 12, 4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = stoneGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(x - 10, y + 2);
            this.ctx.lineTo(x - 5, y - 8);
            this.ctx.lineTo(x + 4, y - 10);
            this.ctx.lineTo(x + 11, y - 1);
            this.ctx.lineTo(x + 6, y + 9);
            this.ctx.lineTo(x - 4, y + 8);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
            this.ctx.beginPath();
            this.ctx.moveTo(x - 3, y - 7);
            this.ctx.lineTo(x + 3, y - 8);
            this.ctx.lineTo(x + 5, y - 3);
            this.ctx.lineTo(x - 1, y - 1);
            this.ctx.closePath();
            this.ctx.fill();
            return;
        }
        if (drop.itemId === "charcoal") {
            const coalGradient = this.ctx.createLinearGradient(x - 10, y - 8, x + 10, y + 10);
            coalGradient.addColorStop(0, "#94908a");
            coalGradient.addColorStop(0.45, "#4d4743");
            coalGradient.addColorStop(1, "#1f1a18");
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
            this.ctx.beginPath();
            this.ctx.ellipse(x, y + 10, 12, 4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = coalGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(x - 10, y + 2);
            this.ctx.lineTo(x - 6, y - 7);
            this.ctx.lineTo(x + 1, y - 9);
            this.ctx.lineTo(x + 10, y - 2);
            this.ctx.lineTo(x + 6, y + 8);
            this.ctx.lineTo(x - 3, y + 7);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = "rgba(255, 228, 144, 0.22)";
            this.ctx.beginPath();
            this.ctx.arc(x - 1, y - 1, 2.4, 0, Math.PI * 2);
            this.ctx.arc(x + 4, y + 2, 1.8, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 11, 12, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        const slimeGradient = this.ctx.createRadialGradient(x - 3, y - 6, 2, x, y, 12);
        slimeGradient.addColorStop(0, "#dcffbf");
        slimeGradient.addColorStop(0.6, "#93e05a");
        slimeGradient.addColorStop(1, "#439b42");
        this.ctx.fillStyle = slimeGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 11, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        this.ctx.beginPath();
        this.ctx.arc(x - 3, y - 4, 3.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#dffff2";
        this.ctx.beginPath();
        this.ctx.arc(x + 4, y + 1, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
}
