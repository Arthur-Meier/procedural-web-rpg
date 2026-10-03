// Shared visual clock: breeze pulses move through the forest from left to right.
export function windTravel(seconds: number): number {
  return seconds * 24 + Math.sin(seconds * 0.6) * 12;
}

export function treeWindFrame(timestamp: number, x: number, y: number, hash: number): number {
  const seconds = Math.max(0, timestamp) / 1000;
  const phase = seconds / 0.22 + Math.sin(seconds * 0.6) * 0.45 - x * 0.13 - y * 0.08 + (hash % 17) / 17;
  return ((Math.floor(phase) % 8) + 8) % 8;
}
