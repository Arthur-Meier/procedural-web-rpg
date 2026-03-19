import { clamp, lerp } from "./utils.js";
export const DEFAULT_DAY_NIGHT_CONFIG = Object.freeze({
    dayDurationSeconds: 60,
    nightDurationSeconds: 20,
    initialTimeSeconds: 10
});
// The keyframes are defined in relative day/night progress so we can change
// the duration of each period later without rebuilding the color logic.
const DAY_NIGHT_KEYFRAMES = Object.freeze([
    {
        section: "day",
        progress: 0,
        phase: "dawn",
        atmosphereTop: "#3d5686",
        atmosphereBottom: "#f09a68",
        atmosphereAlpha: 0.16,
        tintColor: "#ffbf86",
        tintAlpha: 0.07,
        shadowColor: "#15263d",
        shadowAlpha: 0.14,
        celestialColor: "#ffd39d",
        celestialAlpha: 0.22,
        celestialX: 0.16,
        celestialY: 0.28,
        celestialRadius: 0.48,
        vignetteAlpha: 0.2
    },
    {
        section: "day",
        progress: 0.12,
        phase: "sunrise",
        atmosphereTop: "#728ad0",
        atmosphereBottom: "#ffd08b",
        atmosphereAlpha: 0.14,
        tintColor: "#ffcb84",
        tintAlpha: 0.065,
        shadowColor: "#132338",
        shadowAlpha: 0.11,
        celestialColor: "#ffe0a6",
        celestialAlpha: 0.28,
        celestialX: 0.22,
        celestialY: 0.18,
        celestialRadius: 0.56,
        vignetteAlpha: 0.18
    },
    {
        section: "day",
        progress: 0.28,
        phase: "morning",
        atmosphereTop: "#73b8ef",
        atmosphereBottom: "#fff0c6",
        atmosphereAlpha: 0.09,
        tintColor: "#fff1c1",
        tintAlpha: 0.034,
        shadowColor: "#10202c",
        shadowAlpha: 0.06,
        celestialColor: "#fff2c2",
        celestialAlpha: 0.2,
        celestialX: 0.3,
        celestialY: 0.12,
        celestialRadius: 0.64,
        vignetteAlpha: 0.12
    },
    {
        section: "day",
        progress: 0.5,
        phase: "noon",
        atmosphereTop: "#9ed8ff",
        atmosphereBottom: "#fffaf0",
        atmosphereAlpha: 0.05,
        tintColor: "#fffdf3",
        tintAlpha: 0.008,
        shadowColor: "#0c1821",
        shadowAlpha: 0.03,
        celestialColor: "#fff6d1",
        celestialAlpha: 0.12,
        celestialX: 0.5,
        celestialY: 0.08,
        celestialRadius: 0.72,
        vignetteAlpha: 0.08
    },
    {
        section: "day",
        progress: 0.72,
        phase: "afternoon",
        atmosphereTop: "#63a7e5",
        atmosphereBottom: "#ffd694",
        atmosphereAlpha: 0.08,
        tintColor: "#ffd28c",
        tintAlpha: 0.042,
        shadowColor: "#10202d",
        shadowAlpha: 0.08,
        celestialColor: "#ffe0a5",
        celestialAlpha: 0.2,
        celestialX: 0.68,
        celestialY: 0.12,
        celestialRadius: 0.66,
        vignetteAlpha: 0.14
    },
    {
        section: "day",
        progress: 0.9,
        phase: "goldenHour",
        atmosphereTop: "#5076bb",
        atmosphereBottom: "#ffae5d",
        atmosphereAlpha: 0.13,
        tintColor: "#ffaf5f",
        tintAlpha: 0.078,
        shadowColor: "#172336",
        shadowAlpha: 0.14,
        celestialColor: "#ffc772",
        celestialAlpha: 0.3,
        celestialX: 0.79,
        celestialY: 0.16,
        celestialRadius: 0.58,
        vignetteAlpha: 0.2
    },
    {
        section: "day",
        progress: 1,
        phase: "sunset",
        atmosphereTop: "#2c416f",
        atmosphereBottom: "#e67b4f",
        atmosphereAlpha: 0.17,
        tintColor: "#ea8854",
        tintAlpha: 0.09,
        shadowColor: "#122038",
        shadowAlpha: 0.2,
        celestialColor: "#ffab60",
        celestialAlpha: 0.22,
        celestialX: 0.87,
        celestialY: 0.24,
        celestialRadius: 0.54,
        vignetteAlpha: 0.24
    },
    {
        section: "night",
        progress: 0.36,
        phase: "blueHour",
        atmosphereTop: "#142745",
        atmosphereBottom: "#405a83",
        atmosphereAlpha: 0.18,
        tintColor: "#78afea",
        tintAlpha: 0.045,
        shadowColor: "#091321",
        shadowAlpha: 0.3,
        celestialColor: "#c6dcff",
        celestialAlpha: 0.08,
        celestialX: 0.75,
        celestialY: 0.18,
        celestialRadius: 0.46,
        vignetteAlpha: 0.34
    },
    {
        section: "night",
        progress: 0.72,
        phase: "midnight",
        atmosphereTop: "#060d1b",
        atmosphereBottom: "#162846",
        atmosphereAlpha: 0.24,
        tintColor: "#5a90cb",
        tintAlpha: 0.042,
        shadowColor: "#040912",
        shadowAlpha: 0.46,
        celestialColor: "#d8e8ff",
        celestialAlpha: 0.05,
        celestialX: 0.6,
        celestialY: 0.14,
        celestialRadius: 0.38,
        vignetteAlpha: 0.54
    },
    {
        section: "night",
        progress: 0.92,
        phase: "predawn",
        atmosphereTop: "#182848",
        atmosphereBottom: "#5f7599",
        atmosphereAlpha: 0.18,
        tintColor: "#a4c4ee",
        tintAlpha: 0.035,
        shadowColor: "#08111d",
        shadowAlpha: 0.31,
        celestialColor: "#d9e7ff",
        celestialAlpha: 0.06,
        celestialX: 0.32,
        celestialY: 0.2,
        celestialRadius: 0.44,
        vignetteAlpha: 0.36
    },
    {
        section: "night",
        progress: 1,
        phase: "dawn",
        atmosphereTop: "#4f6f9a",
        atmosphereBottom: "#f3bc86",
        atmosphereAlpha: 0.12,
        tintColor: "#ffd6a1",
        tintAlpha: 0.05,
        shadowColor: "#15263d",
        shadowAlpha: 0.1,
        celestialColor: "#ffd39d",
        celestialAlpha: 0.18,
        celestialX: 0.16,
        celestialY: 0.28,
        celestialRadius: 0.48,
        vignetteAlpha: 0.16
    }
]);
export class DayNightSystem {
    constructor(config = DEFAULT_DAY_NIGHT_CONFIG) {
        this.config = config;
        this.totalDurationSeconds = Math.max(1, config.dayDurationSeconds + config.nightDurationSeconds);
        this.elapsedSeconds = this.wrapTime(config.initialTimeSeconds);
    }
    update(dt) {
        if (dt <= 0) {
            return;
        }
        this.elapsedSeconds = this.wrapTime(this.elapsedSeconds + dt);
    }
    reset(elapsedSeconds = this.config.initialTimeSeconds) {
        this.elapsedSeconds = this.wrapTime(elapsedSeconds);
    }
    setElapsedTime(elapsedSeconds) {
        this.elapsedSeconds = this.wrapTime(elapsedSeconds);
    }
    getElapsedTime() {
        return this.elapsedSeconds;
    }
    createSnapshot() {
        return {
            elapsedSeconds: this.elapsedSeconds
        };
    }
    getLightingState() {
        const normalizedTime = this.elapsedSeconds / this.totalDurationSeconds;
        const dayRatio = this.config.dayDurationSeconds / this.totalDurationSeconds;
        const dayProgress = dayRatio > 0 ? clamp(normalizedTime / dayRatio, 0, 1) : 1;
        const nightProgress = dayRatio < 1 && normalizedTime > dayRatio ? clamp((normalizedTime - dayRatio) / (1 - dayRatio), 0, 1) : 0;
        const keyframes = this.resolveKeyframes();
        const [from, to, segmentT] = this.resolveSegment(keyframes, normalizedTime);
        const easedT = smoothStep(segmentT);
        return {
            elapsedSeconds: this.elapsedSeconds,
            cycleDurationSeconds: this.totalDurationSeconds,
            normalizedTime,
            dayProgress,
            nightProgress,
            phase: from.phase,
            isNight: normalizedTime >= dayRatio,
            atmosphereTop: mixColor(from.atmosphereTop, to.atmosphereTop, easedT),
            atmosphereBottom: mixColor(from.atmosphereBottom, to.atmosphereBottom, easedT),
            atmosphereAlpha: lerp(from.atmosphereAlpha, to.atmosphereAlpha, easedT),
            tintColor: mixColor(from.tintColor, to.tintColor, easedT),
            tintAlpha: lerp(from.tintAlpha, to.tintAlpha, easedT),
            shadowColor: mixColor(from.shadowColor, to.shadowColor, easedT),
            shadowAlpha: lerp(from.shadowAlpha, to.shadowAlpha, easedT),
            celestialColor: mixColor(from.celestialColor, to.celestialColor, easedT),
            celestialAlpha: lerp(from.celestialAlpha, to.celestialAlpha, easedT),
            celestialX: lerp(from.celestialX, to.celestialX, easedT),
            celestialY: lerp(from.celestialY, to.celestialY, easedT),
            celestialRadius: lerp(from.celestialRadius, to.celestialRadius, easedT),
            vignetteAlpha: lerp(from.vignetteAlpha, to.vignetteAlpha, easedT)
        };
    }
    wrapTime(value) {
        const wrapped = value % this.totalDurationSeconds;
        return wrapped < 0 ? wrapped + this.totalDurationSeconds : wrapped;
    }
    resolveKeyframes() {
        const dayRatio = this.config.dayDurationSeconds / this.totalDurationSeconds;
        return DAY_NIGHT_KEYFRAMES.map((frame) => ({
            ...frame,
            time: frame.section === "day" ? dayRatio * frame.progress : dayRatio + (1 - dayRatio) * frame.progress
        }));
    }
    resolveSegment(keyframes, normalizedTime) {
        for (let index = 0; index < keyframes.length - 1; index += 1) {
            const current = keyframes[index];
            const next = keyframes[index + 1];
            if (normalizedTime <= next.time) {
                const span = Math.max(0.0001, next.time - current.time);
                return [current, next, clamp((normalizedTime - current.time) / span, 0, 1)];
            }
        }
        const last = keyframes[keyframes.length - 1];
        return [last, last, 0];
    }
}
export function hexToRgba(hex, alpha) {
    const { r, g, b } = parseHexColor(hex);
    return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}
function mixColor(from, to, t) {
    const a = parseHexColor(from);
    const b = parseHexColor(to);
    return rgbToHex({
        r: Math.round(lerp(a.r, b.r, t)),
        g: Math.round(lerp(a.g, b.g, t)),
        b: Math.round(lerp(a.b, b.b, t))
    });
}
function parseHexColor(hex) {
    const normalized = hex.replace("#", "");
    const full = normalized.length === 3
        ? normalized.split("").map((entry) => `${entry}${entry}`).join("")
        : normalized;
    return {
        r: Number.parseInt(full.slice(0, 2), 16),
        g: Number.parseInt(full.slice(2, 4), 16),
        b: Number.parseInt(full.slice(4, 6), 16)
    };
}
function rgbToHex(color) {
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
function toHex(channel) {
    return clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0");
}
function smoothStep(value) {
    const clamped = clamp(value, 0, 1);
    return clamped * clamped * (3 - 2 * clamped);
}
