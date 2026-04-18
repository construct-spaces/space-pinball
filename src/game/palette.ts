import type { BodyKind } from './bodies'

/** Single source of truth for body + VFX colors (hex numeric for pixi). */
export const COLORS = {
  ball: 0xf5f5fa,
  bumper: 0xff4d6d,
  slingshot: 0xffd166,
  dropTarget: 0x06d6a0,
  flipper: 0xe0e0e8,
  wall: 0x2a2a3a,
  post: 0xa29bfe,
  drain: 0x000000,
  accent: 0x6c5ce7,
} as const

export function colorFor(kind: BodyKind): number {
  switch (kind) {
    case 'ball':
      return COLORS.ball
    case 'bumper':
      return COLORS.bumper
    case 'slingshot':
      return COLORS.slingshot
    case 'dropTarget':
      return COLORS.dropTarget
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
