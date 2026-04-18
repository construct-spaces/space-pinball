import type { BodyKind } from './bodies'

/** Single source of truth for body + VFX colors (hex numeric for pixi). */
export const COLORS = {
  ball: 0xf5f5fa,
  bumper: 0xff4d6d,
  slingshot: 0xffd166,
  flipper: 0xe0e0e8,
  wall: 0x2a2a3a,
  post: 0xa29bfe,
  drain: 0x000000,
  accent: 0x6c5ce7,
  rolloverUnlit: 0x335577,
  rolloverLit: 0x9be7ff,
  teleport: 0xd946ef,
  peg: 0x999999,
  arcRail: 0x4a5a7a,
} as const

export function colorFor(kind: BodyKind): number {
  switch (kind) {
    case 'ball':
      return COLORS.ball
    case 'bumper':
      return COLORS.bumper
    case 'slingshot':
      return COLORS.slingshot
    case 'rollover':
      return COLORS.rolloverUnlit
    case 'teleport':
      return COLORS.teleport
    case 'peg':
      return COLORS.peg
    case 'arcRail':
      return COLORS.arcRail
    case 'flipperLeft':
    case 'flipperRight':
      return COLORS.flipper
    case 'post':
      return COLORS.post
    case 'drain':
      return COLORS.drain
    default:
      return COLORS.wall
  }
}
