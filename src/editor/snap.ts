export function snapToGrid(value: number, gridSize = 10, force = false): number {
  if (force) return value
  return Math.round(value / gridSize) * gridSize
}

export function snapPoint(
  p: { x: number; y: number },
  gridSize = 10,
  force = false,
): { x: number; y: number } {
  return { x: snapToGrid(p.x, gridSize, force), y: snapToGrid(p.y, gridSize, force) }
}
