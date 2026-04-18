import type { Element, Layout } from './types'

const W = 600
const H = 900
const wallT = 20

function uid(): string {
  return crypto.randomUUID()
}

export function newBlankLayout(): Layout {
  const now = Date.now()
  const drainCenterX = (180 + 380) / 2
  const drainWidth = 80
  const elements: Element[] = [
    { id: uid(), kind: 'wall', x: wallT / 2, y: H / 2, w: wallT, h: H, angle: 0 },
    { id: uid(), kind: 'wall', x: W - wallT / 2, y: H / 2, w: wallT, h: H, angle: 0 },
    { id: uid(), kind: 'wall', x: W / 2, y: wallT / 2, w: W, h: wallT, angle: 0 },
    {
      id: uid(),
      kind: 'wall',
      x: (wallT + drainCenterX - drainWidth / 2) / 2,
      y: H - 10,
      w: drainCenterX - drainWidth / 2 - wallT,
      h: 20,
      angle: 0,
    },
    {
      id: uid(),
      kind: 'wall',
      x: (drainCenterX + drainWidth / 2 + (W - wallT)) / 2,
      y: H - 10,
      w: W - wallT - (drainCenterX + drainWidth / 2),
      h: 20,
      angle: 0,
    },
    { id: uid(), kind: 'drain', x: drainCenterX, y: H - 4, w: drainWidth, h: 8, angle: 0 },
    { id: uid(), kind: 'flipperLeft', x: 180, y: H - 100 },
    { id: uid(), kind: 'flipperRight', x: 380, y: H - 100 },
  ]
  return {
    id: uid(),
    name: 'Untitled',
    width: W,
    height: H,
    ballStart: { x: 550, y: 820 },
    plungerVisual: { x: 550, y: 880, w: 28, h: 14 },
    elements,
    createdAt: now,
    updatedAt: now,
  }
}
