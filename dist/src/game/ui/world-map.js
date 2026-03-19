import { clamp, hashCoords } from "../utils.js";
export function getWorldMapLayout(args) {
    const { world, player, mapCanvas, mapPanX, mapPanY } = args;
    if (!world || !player) {
        return null;
    }
    const rect = mapCanvas.getBoundingClientRect();
    const viewportWidth = Math.max(320, Math.round(rect.width || mapCanvas.width || 520));
    const viewportHeight = Math.max(260, Math.round(rect.height || mapCanvas.height || 520));
    if (mapCanvas.width !== viewportWidth) {
        mapCanvas.width = viewportWidth;
    }
    if (mapCanvas.height !== viewportHeight) {
        mapCanvas.height = viewportHeight;
    }
    const bounds = world.getDiscoveredBounds();
    const discoveredWidth = bounds.maxX - bounds.minX + 1;
    const discoveredHeight = bounds.maxY - bounds.minY + 1;
    const padding = Math.max(18, Math.round(Math.min(viewportWidth, viewportHeight) * 0.045));
    const fitCell = Math.min((viewportWidth - padding * 2) / Math.max(1, discoveredWidth), (viewportHeight - padding * 2) / Math.max(1, discoveredHeight));
    const cell = clamp(fitCell, 18, 44);
    const contentWidth = discoveredWidth * cell;
    const contentHeight = discoveredHeight * cell;
    const canPanX = contentWidth > viewportWidth - padding * 2;
    const canPanY = contentHeight > viewportHeight - padding * 2;
    const minOffsetX = canPanX ? viewportWidth - padding - contentWidth : (viewportWidth - contentWidth) / 2;
    const maxOffsetX = canPanX ? padding : (viewportWidth - contentWidth) / 2;
    const minOffsetY = canPanY ? viewportHeight - padding - contentHeight : (viewportHeight - contentHeight) / 2;
    const maxOffsetY = canPanY ? padding : (viewportHeight - contentHeight) / 2;
    const offsetX = clamp(mapPanX, minOffsetX, maxOffsetX);
    const offsetY = clamp(mapPanY, minOffsetY, maxOffsetY);
    return {
        bounds,
        cell,
        contentWidth,
        contentHeight,
        minOffsetX,
        maxOffsetX,
        minOffsetY,
        maxOffsetY,
        offsetX,
        offsetY,
        viewportWidth,
        viewportHeight,
        canPan: canPanX || canPanY
    };
}
export function renderWorldMap(args) {
    const layout = getWorldMapLayout(args);
    if (!layout) {
        return null;
    }
    const { world, player, mapCanvas, mapContext, seed } = args;
    mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    mapContext.fillStyle = "#08110d";
    mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    mapCanvas.classList.toggle("map-draggable", layout.canPan);
    for (const key of world.discoveredChunks) {
        const [cx, cy] = key.split(",").map(Number);
        const x = layout.offsetX + (cx - layout.bounds.minX) * layout.cell;
        const y = layout.offsetY + (cy - layout.bounds.minY) * layout.cell;
        const tint = hashCoords(seed, cx, cy);
        mapContext.fillStyle = tint > 0.5 ? "#4c7a47" : "#3f6940";
        mapContext.fillRect(x, y, Math.max(4, layout.cell - 2), Math.max(4, layout.cell - 2));
    }
    const playerChunk = world.getChunkCoordinates(player.x, player.y);
    const playerX = layout.offsetX + (playerChunk.x - layout.bounds.minX) * layout.cell + layout.cell / 2;
    const playerY = layout.offsetY + (playerChunk.y - layout.bounds.minY) * layout.cell + layout.cell / 2;
    mapContext.fillStyle = "#ffe8a6";
    mapContext.beginPath();
    mapContext.arc(playerX, playerY, Math.max(4, layout.cell * 0.18), 0, Math.PI * 2);
    mapContext.fill();
    mapContext.strokeStyle = "#fff8dc";
    mapContext.lineWidth = 2;
    mapContext.beginPath();
    mapContext.moveTo(playerX, playerY);
    mapContext.lineTo(playerX + Math.cos(player.facingAngle) * Math.max(10, layout.cell * 0.34), playerY + Math.sin(player.facingAngle) * Math.max(10, layout.cell * 0.34));
    mapContext.stroke();
    const edgeFade = mapContext.createLinearGradient(0, 0, mapCanvas.width, 0);
    edgeFade.addColorStop(0, "rgba(8, 17, 13, 0.82)");
    edgeFade.addColorStop(0.08, "rgba(8, 17, 13, 0)");
    edgeFade.addColorStop(0.92, "rgba(8, 17, 13, 0)");
    edgeFade.addColorStop(1, "rgba(8, 17, 13, 0.82)");
    mapContext.fillStyle = edgeFade;
    mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    const topFade = mapContext.createLinearGradient(0, 0, 0, mapCanvas.height);
    topFade.addColorStop(0, "rgba(8, 17, 13, 0.82)");
    topFade.addColorStop(0.08, "rgba(8, 17, 13, 0)");
    topFade.addColorStop(0.92, "rgba(8, 17, 13, 0)");
    topFade.addColorStop(1, "rgba(8, 17, 13, 0.82)");
    mapContext.fillStyle = topFade;
    mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    return layout;
}
export function centerMapOnPlayer(args) {
    const layout = getWorldMapLayout(args);
    if (!layout) {
        return null;
    }
    const playerChunk = args.world.getChunkCoordinates(args.player.x, args.player.y);
    const playerMapX = (playerChunk.x - layout.bounds.minX) * layout.cell + layout.cell / 2;
    const playerMapY = (playerChunk.y - layout.bounds.minY) * layout.cell + layout.cell / 2;
    return {
        x: clamp(layout.viewportWidth / 2 - playerMapX, layout.minOffsetX, layout.maxOffsetX),
        y: clamp(layout.viewportHeight / 2 - playerMapY, layout.minOffsetY, layout.maxOffsetY)
    };
}
