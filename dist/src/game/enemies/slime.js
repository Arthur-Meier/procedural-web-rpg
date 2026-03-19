import { Enemy } from "./enemy.js";
export class Slime extends Enemy {
    static get kind() {
        return "slime";
    }
    static get multiplier() {
        return 1;
    }
}
