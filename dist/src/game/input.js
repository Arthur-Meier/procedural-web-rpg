export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keysDown = new Set();
        this.keysPressed = new Set();
        this.mouseDown = new Set();
        this.mousePressed = new Set();
        this.mouse = { x: 0, y: 0, inside: false };
        window.addEventListener("keydown", (event) => {
            if (event.repeat) {
                return;
            }
            this.keysDown.add(event.code);
            this.keysPressed.add(event.code);
            const normalizedKey = this.normalizeKey(event.key);
            if (normalizedKey) {
                this.keysDown.add(normalizedKey);
                this.keysPressed.add(normalizedKey);
            }
        });
        window.addEventListener("keyup", (event) => {
            this.keysDown.delete(event.code);
            const normalizedKey = this.normalizeKey(event.key);
            if (normalizedKey) {
                this.keysDown.delete(normalizedKey);
            }
        });
        window.addEventListener("blur", () => {
            this.keysDown.clear();
            this.keysPressed.clear();
            this.mouseDown.clear();
            this.mousePressed.clear();
        });
        canvas.addEventListener("mousemove", (event) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
            this.mouse.inside = true;
        });
        canvas.addEventListener("mouseleave", () => {
            this.mouse.inside = false;
        });
        canvas.addEventListener("mousedown", (event) => {
            this.mouseDown.add(event.button);
            this.mousePressed.add(event.button);
        });
        canvas.addEventListener("mouseup", (event) => {
            this.mouseDown.delete(event.button);
        });
        window.addEventListener("mouseup", (event) => {
            this.mouseDown.delete(event.button);
        });
        canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
    }
    getAxis() {
        const left = this.keysDown.has("KeyA") || this.keysDown.has("ArrowLeft");
        const right = this.keysDown.has("KeyD") || this.keysDown.has("ArrowRight");
        const up = this.keysDown.has("KeyW") || this.keysDown.has("ArrowUp");
        const down = this.keysDown.has("KeyS") || this.keysDown.has("ArrowDown");
        return {
            x: (right ? 1 : 0) - (left ? 1 : 0),
            y: (down ? 1 : 0) - (up ? 1 : 0)
        };
    }
    pressed(code) {
        return this.keysPressed.has(code);
    }
    down(code) {
        return this.keysDown.has(code);
    }
    pressedKey(key) {
        return this.keysPressed.has(this.normalizeKey(key));
    }
    downKey(key) {
        return this.keysDown.has(this.normalizeKey(key));
    }
    mouseClicked(button) {
        return this.mousePressed.has(button);
    }
    endFrame() {
        this.keysPressed.clear();
        this.mousePressed.clear();
    }
    normalizeKey(key) {
        if (!key) {
            return "";
        }
        return `key:${key.toLowerCase()}`;
    }
}
