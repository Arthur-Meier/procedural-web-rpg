import type { AxisInput, MouseState } from "./types.js";

export class InputManager {
  canvas: HTMLCanvasElement;
  keysDown: Set<string>;
  keysPressed: Set<string>;
  mouseDown: Set<number>;
  mousePressed: Set<number>;
  mouse: MouseState;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.mouseDown = new Set();
    this.mousePressed = new Set();
    this.mouse = { x: 0, y: 0, inside: false };

    window.addEventListener("keydown", (event: KeyboardEvent) => {
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

    window.addEventListener("keyup", (event: KeyboardEvent) => {
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

    canvas.addEventListener("mousemove", (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
      this.mouse.inside = true;
    });

    canvas.addEventListener("mouseleave", () => {
      this.mouse.inside = false;
    });

    canvas.addEventListener("mousedown", (event: MouseEvent) => {
      this.mouseDown.add(event.button);
      this.mousePressed.add(event.button);
    });

    canvas.addEventListener("mouseup", (event: MouseEvent) => {
      this.mouseDown.delete(event.button);
    });

    window.addEventListener("mouseup", (event: MouseEvent) => {
      this.mouseDown.delete(event.button);
    });

    canvas.addEventListener("contextmenu", (event: MouseEvent) => {
      event.preventDefault();
    });
  }

  getAxis(): AxisInput {
    const left = this.keysDown.has("KeyA") || this.keysDown.has("ArrowLeft");
    const right = this.keysDown.has("KeyD") || this.keysDown.has("ArrowRight");
    const up = this.keysDown.has("KeyW") || this.keysDown.has("ArrowUp");
    const down = this.keysDown.has("KeyS") || this.keysDown.has("ArrowDown");

    return {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      y: (down ? 1 : 0) - (up ? 1 : 0)
    };
  }

  pressed(code: string): boolean {
    return this.keysPressed.has(code);
  }

  down(code: string): boolean {
    return this.keysDown.has(code);
  }

  pressedKey(key: string): boolean {
    return this.keysPressed.has(this.normalizeKey(key));
  }

  downKey(key: string): boolean {
    return this.keysDown.has(this.normalizeKey(key));
  }

  mouseClicked(button: number): boolean {
    return this.mousePressed.has(button);
  }

  endFrame(): void {
    this.keysPressed.clear();
    this.mousePressed.clear();
  }

  normalizeKey(key: string): string {
    if (!key) {
      return "";
    }

    return `key:${key.toLowerCase()}`;
  }
}
