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
  kind: 'bumper' | 'peg'
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
  createdAt: number
  updatedAt: number
  publishedId?: string
}

export const RECT_KINDS = new Set<ElementKind>(['wall', 'slingshot', 'rollover', 'drain'])
export const CIRCLE_KINDS = new Set<ElementKind>(['bumper', 'peg'])
export const FLIPPER_KINDS = new Set<ElementKind>(['flipperLeft', 'flipperRight'])
export const POLYLINE_KINDS = new Set<ElementKind>(['arcRail', 'gateRail'])
