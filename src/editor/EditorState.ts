import { reactive, computed, toRaw } from 'vue'
import { History } from './History'
import { LayoutStore } from './LayoutStore'
import { newBlankLayout } from './boilerplate'
import type { Element, ElementKind, Layout } from './types'

export type Mode =
  | 'select'
  | { kind: 'place'; elementKind: ElementKind }
  | { kind: 'polyline'; elementKind: 'arcRail' | 'gateRail'; points: Array<{ x: number; y: number }> }

export const BALL_START_ID = '__ballStart__'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(toRaw(v))) as T
}

const persistence = new LayoutStore()

interface State {
  layout: Layout
  selectedId: string | undefined
  mode: Mode
  testPlayOpen: boolean
}

const state = reactive<State>({
  layout: newBlankLayout(),
  selectedId: undefined,
  mode: 'select',
  testPlayOpen: false,
})

const history = new History<Layout>(100)
history.push(clone(state.layout))

function setLayout(next: Layout): void {
  state.layout = next
  state.selectedId = undefined
  history.push(clone(next))
}

function commit(): void {
  history.push(clone(state.layout))
  persistence.save(state.layout)
}

function addElement(e: Element): void {
  state.layout.elements.push(e)
  state.selectedId = e.id
  commit()
}

function updateSelected(patch: Partial<Element>): void {
  if (state.selectedId === BALL_START_ID) {
    const p = patch as Partial<{ x: number; y: number }>
    if (p.x !== undefined) state.layout.ballStart.x = p.x
    if (p.y !== undefined) state.layout.ballStart.y = p.y
    commit()
    return
  }
  const i = state.layout.elements.findIndex((x) => x.id === state.selectedId)
  if (i < 0) return
  const merged = { ...state.layout.elements[i], ...patch } as Element
  state.layout.elements.splice(i, 1, merged)
  commit()
}

function deleteSelected(): void {
  if (!state.selectedId) return
  if (state.selectedId === BALL_START_ID) return
  state.layout.elements = state.layout.elements.filter((e) => e.id !== state.selectedId)
  state.selectedId = undefined
  commit()
}

function undo(): void {
  const prev = history.undo()
  if (prev) state.layout = clone(prev)
}

function redo(): void {
  const next = history.redo()
  if (next) state.layout = clone(next)
}

function loadLayout(id: string): void {
  const found = persistence.get(id)
  if (!found) return
  setLayout(found)
}

function newLayout(): void {
  setLayout(newBlankLayout())
  persistence.save(state.layout)
}

function rename(name: string): void {
  state.layout.name = name
  commit()
}

function testPlay(): void {
  persistence.saveDraft(state.layout)
  state.testPlayOpen = true
}

function closeTestPlay(): void {
  state.testPlayOpen = false
}

const selected = computed(() => {
  if (state.selectedId === BALL_START_ID) {
    return {
      id: BALL_START_ID,
      kind: 'ballStart' as const,
      x: state.layout.ballStart.x,
      y: state.layout.ballStart.y,
    }
  }
  return state.layout.elements.find((e) => e.id === state.selectedId)
})

export function useEditorStore() {
  return {
    state,
    get layout() { return state.layout },
    get selectedId() { return state.selectedId },
    set selectedId(v: string | undefined) { state.selectedId = v },
    get mode() { return state.mode },
    set mode(v: Mode) { state.mode = v },
    selected,
    setLayout,
    addElement,
    updateSelected,
    deleteSelected,
    undo,
    redo,
    loadLayout,
    newLayout,
    rename,
    testPlay,
    closeTestPlay,
    listLayouts: () => persistence.list(),
    duplicate: (id: string) => persistence.duplicate(id),
    remove: (id: string) => persistence.remove(id),
  }
}
