export type BodyKind =
  | 'wall'
  | 'bumper'
  | 'slingshot'
  | 'dropTarget'
  | 'flipperLeft'
  | 'flipperRight'
  | 'plunger'
  | 'post'
  | 'ball'
  | 'drain'

export type BodyShape =
  | { type: 'circle'; r: number }
  | { type: 'rect'; w: number; h: number }

export interface GameBody {
  id: string
  kind: BodyKind
  shape: BodyShape
  x: number
  y: number
  angle: number
  visible: boolean
}
