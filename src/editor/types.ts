export type ElementKind =
  | 'wall'
  | 'bumper'
  | 'slingshot'
  | 'peg'
  | 'rollover'
  | 'drain'
  | 'flipperLeft'
  | 'flipperRight'
  | 'arcRail'
  | 'gateRail'
  | 'ballStart'
  | 'teleport'

export interface RectElement {
  id: string
  kind: 'wall' | 'slingshot' | 'rollover' | 'drain'
  x: number
  y: number
  w: number
  h: number
  angle: number
}

export interface CircleElement {
  id: string
  kind: 'bumper' | 'peg' | 'teleport'
  x: number
  y: number
  r: number
}

export interface FlipperElement {
  id: string
  kind: 'flipperLeft' | 'flipperRight'
  x: number
  y: number
}

export interface PolylineElement {
  id: string
  kind: 'arcRail' | 'gateRail'
  points: Array<{ x: number; y: number }>
  thickness: number
}

export type Element = RectElement | CircleElement | FlipperElement | PolylineElement

export interface Layout {
  id: string
  name: string
  width: number
  height: number
  ballStart: { x: number; y: number }
  plungerVisual: { x: number; y: number; w: number; h: number }
  elements: Element[]
  decorations?: Decor[]
  createdAt: number
  updatedAt: number
  publishedId?: string
}

export const RECT_KINDS = new Set<ElementKind>(['wall', 'slingshot', 'rollover', 'drain'])
export const CIRCLE_KINDS = new Set<ElementKind>(['bumper', 'peg', 'teleport'])
export const FLIPPER_KINDS = new Set<ElementKind>(['flipperLeft', 'flipperRight'])
export const POLYLINE_KINDS = new Set<ElementKind>(['arcRail', 'gateRail'])

export type DecorKind = 'light' | 'text' | 'emitter'

export type TriggerEvent =
  | { type: 'bumper' | 'slingshot' | 'rollover' | 'rolloverBank' | 'ballLost' | 'gameOver' }
  | { type: 'hit'; sourceId: string }

interface DecorBase {
  id: string
  kind: DecorKind
  x: number
  y: number
  trigger?: TriggerEvent
}

export interface LightDecor extends DecorBase {
  kind: 'light'
  r: number
  color: string
  intensity: number
}

export interface TextDecor extends DecorBase {
  kind: 'text'
  text: string
  size: number
  color: string
}

export interface EmitterDecor extends DecorBase {
  kind: 'emitter'
  count: number
  color: string
  spread: number
  speed: number
}

export type Decor = LightDecor | TextDecor | EmitterDecor

export const DECOR_KINDS: DecorKind[] = ['light', 'text', 'emitter']
