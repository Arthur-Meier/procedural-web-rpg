export const SPELL_CAST_DELAY = 0.5;
export const PLAYER_LEVEL_UP_AURA_DURATION = 0.9;
export const ENEMY_DEATH_EFFECT_DURATION = 0.44;
export const SPAWN_HOUSE = Object.freeze({
    x: 4.8,
    y: -2.1,
    width: 4.8,
    height: 3.4
});
export const SPAWN_HOUSE_FOOTPRINT = Object.freeze({
    x: SPAWN_HOUSE.x,
    y: SPAWN_HOUSE.y + 1.02,
    width: 4.24,
    height: 2.82
});
export const SPAWN_HOUSE_COLLIDER = SPAWN_HOUSE_FOOTPRINT;
export const GUIDE_NPC = Object.freeze({
    x: SPAWN_HOUSE.x - 0.18,
    y: SPAWN_HOUSE.y + 2.54,
    radius: 0.38,
    dialog: "Olá aventureiro!"
});
export const GUIDE_NPC_TALK_DISTANCE = 1.28;
export const QUEST_SIGN = Object.freeze({
    x: SPAWN_HOUSE_FOOTPRINT.x - SPAWN_HOUSE_FOOTPRINT.width * 0.56,
    y: GUIDE_NPC.y + 0.22,
    radius: 0.46
});
export const QUEST_COMPLETED_REFRESH_MS = 5 * 60 * 1000;
export const QUEST_BOARD_TEMPLATE = Object.freeze([
    {
        id: "huntScout",
        title: "Patrulha da Entrada",
        description: "Mate 3 inimigos para proteger os arredores da casa.",
        killTarget: 3,
        rewardGold: 18
    },
    {
        id: "huntTrail",
        title: "Limpeza da Trilha",
        description: "Mate 6 inimigos que rondam o caminho principal.",
        killTarget: 6,
        rewardGold: 42
    },
    {
        id: "huntForest",
        title: "Ameaca na Mata",
        description: "Mate 10 inimigos escondidos na mata proxima.",
        killTarget: 10,
        rewardGold: 78
    },
    {
        id: "huntElite",
        title: "Defesa do Vilarejo",
        description: "Mate 15 inimigos para provar que a area esta segura.",
        killTarget: 15,
        rewardGold: 130
    }
]);
