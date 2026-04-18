/**
 * Space actions exposed to Construct agents via `space_run_action`.
 * Each action mutates the editor's reactive state in real time.
 *
 * NOTE: Param descriptions are documented in `agent/skills/layout-design.md`
 * rather than inline, because the CLI's manifest extractor regex is greedy
 * and turns inline `description:` fields into spurious top-level actions.
 */
import { useEditorStore, BALL_START_ID } from './editor/EditorState'
import { newBlankLayout } from './editor/boilerplate'
import type { Decor, DecorKind, Element, ElementKind } from './editor/types'

function uid(): string {
  return crypto.randomUUID()
}

function defaultElement(kind: ElementKind, x: number, y: number): Element {
  switch (kind) {
    case 'wall':         return { id: uid(), kind, x, y, w: 40, h: 8, angle: 0 }
    case 'slingshot':    return { id: uid(), kind, x, y, w: 90, h: 18, angle: 0.6 }
    case 'rollover':     return { id: uid(), kind, x, y, w: 28, h: 30, angle: 0 }
    case 'drain':        return { id: uid(), kind, x, y, w: 80, h: 8, angle: 0 }
    case 'bumper':       return { id: uid(), kind, x, y, r: 24 }
    case 'peg':          return { id: uid(), kind, x, y, r: 6 }
    case 'teleport':     return { id: uid(), kind, x, y, r: 16 }
    case 'flipperLeft':
    case 'flipperRight': return { id: uid(), kind, x, y }
    case 'arcRail':
    case 'gateRail':     return { id: uid(), kind, points: [], thickness: 6 }
    case 'ballStart':    return { id: uid(), kind: 'wall', x, y, w: 0, h: 0, angle: 0 }
  }
}

function defaultDecor(kind: DecorKind, x: number, y: number): Decor {
  switch (kind) {
    case 'light':   return { id: uid(), kind, x, y, r: 30, color: '#ff66cc', intensity: 0.6 }
    case 'text':    return { id: uid(), kind, x, y, text: 'TILT', size: 18, color: '#9be7ff' }
    case 'emitter': return { id: uid(), kind, x, y, count: 20, color: '#ffd166', spread: Math.PI, speed: 200 }
  }
}

export const actions = {
  get_layout: {
    description: 'Get the current layout being edited (full JSON).',
    params: {},
    run: async () => {
      const store = useEditorStore()
      return JSON.parse(JSON.stringify(store.layout))
    },
  },

  list_layouts: {
    description: 'List all saved layouts.',
    params: {},
    run: async () => {
      const store = useEditorStore()
      return store.listLayouts().map((l) => ({ id: l.id, name: l.name }))
    },
  },

  load_layout: {
    description: 'Load a saved layout by id and make it the active layout.',
    params: { id: { type: 'string', required: true } },
    run: async (p: { id: string }) => {
      const store = useEditorStore()
      store.loadLayout(p.id)
      return { ok: true, name: store.layout.name }
    },
  },

  new_layout: {
    description: 'Create a fresh boilerplate layout (walls + drain + flippers) and select it.',
    params: { name: { type: 'string' } },
    run: async (p: { name?: string }) => {
      const store = useEditorStore()
      store.newLayout()
      if (p.name) store.rename(p.name)
      return { ok: true, id: store.layout.id, name: store.layout.name }
    },
  },

  rename_layout: {
    description: 'Rename the current layout.',
    params: { name: { type: 'string', required: true } },
    run: async (p: { name: string }) => {
      const store = useEditorStore()
      store.rename(p.name)
      return { ok: true }
    },
  },

  add_element: {
    description: 'Add a physics element. Pass kind plus x,y coordinates. Kinds: wall, bumper, slingshot, peg, rollover, drain, flipperLeft, flipperRight, teleport, arcRail, gateRail.',
    params: {
      kind: { type: 'string', required: true },
      x: { type: 'number', required: true },
      y: { type: 'number', required: true },
    },
    run: async (p: { kind: ElementKind; x: number; y: number }) => {
      const store = useEditorStore()
      const e = defaultElement(p.kind, p.x, p.y)
      store.addElement(e)
      return { ok: true, id: e.id }
    },
  },

  update_element: {
    description: 'Update an element by id with a partial patch (e.g. { x: 100, y: 200, w: 60, angle: 0.4 }).',
    params: {
      id: { type: 'string', required: true },
      patch: { type: 'object', required: true },
    },
    run: async (p: { id: string; patch: Partial<Element> }) => {
      const store = useEditorStore()
      store.selectedId = p.id
      store.updateSelected(p.patch)
      return { ok: true }
    },
  },

  delete_element: {
    description: 'Delete an element by id.',
    params: { id: { type: 'string', required: true } },
    run: async (p: { id: string }) => {
      const store = useEditorStore()
      store.selectedId = p.id
      store.deleteSelected()
      return { ok: true }
    },
  },

  add_decor: {
    description: 'Add a decoration. Pass kind plus x,y. Kinds: light, text, emitter.',
    params: {
      kind: { type: 'string', required: true },
      x: { type: 'number', required: true },
      y: { type: 'number', required: true },
    },
    run: async (p: { kind: DecorKind; x: number; y: number }) => {
      const store = useEditorStore()
      const d = defaultDecor(p.kind, p.x, p.y)
      store.addDecor(d)
      return { ok: true, id: d.id }
    },
  },

  update_decor: {
    description: 'Update a decoration by id with a partial patch.',
    params: {
      id: { type: 'string', required: true },
      patch: { type: 'object', required: true },
    },
    run: async (p: { id: string; patch: Partial<Decor> }) => {
      const store = useEditorStore()
      store.selectedId = p.id
      store.updateDecor(p.patch)
      return { ok: true }
    },
  },

  set_ball_start: {
    description: 'Move the ball spawn point.',
    params: {
      x: { type: 'number', required: true },
      y: { type: 'number', required: true },
    },
    run: async (p: { x: number; y: number }) => {
      const store = useEditorStore()
      store.selectedId = BALL_START_ID
      store.updateSelected({ x: p.x, y: p.y } as Partial<Element>)
      return { ok: true }
    },
  },

  clear_layout: {
    description: 'Reset the current layout to empty boilerplate (keeps walls + drain + flippers).',
    params: {},
    run: async () => {
      const store = useEditorStore()
      const fresh = newBlankLayout()
      fresh.id = store.layout.id
      fresh.name = store.layout.name
      store.setLayout(fresh)
      return { ok: true }
    },
  },
}

export default actions
