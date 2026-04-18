export const PLAYFIELD_WIDTH = 600
export const PLAYFIELD_HEIGHT = 900

export const BALL_RADIUS = 12
// Ball starts in the plunger lane (right side). Lane inner x ∈ [528, 572], ball center 550.
export const BALL_START = { x: 550, y: 820 }

export const STARTING_BALLS = 3

export const POINTS = {
  BUMPER: 100,
  SLINGSHOT: 50,
  ROLLOVER: 10,
  ROLLOVER_BANK: 500,
} as const

export const PHYSICS_STEP_MS = 1000 / 60
export const MAX_ACCUMULATED_MS = 250

// Flippers
export const FLIPPER_REST_ANGLE = 0.45
export const FLIPPER_ACTIVE_ANGLE = -0.55
export const FLIPPER_LENGTH = 90
export const FLIPPER_THICKNESS = 14

// Plunger (charge & launch)
export const PLUNGER_CHARGE_MAX_MS = 800
export const PLUNGER_SPEED_MIN = 1000
export const PLUNGER_SPEED_MAX = 2000

// Physics (Rapier; pixel-space, gravity in px/s^2)
export const GRAVITY_Y = 1400

// Combo
export const COMBO_WINDOW_MS = 2000
export const COMBO_MAX = 5
