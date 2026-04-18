import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { History } from './History'
import { LayoutStore } from './LayoutStore'
import { newBlankLayout } from './boilerplate'
import type { Element, ElementKind, Layout } from './types'

// Deep clone via JSON. Avoids clone's failure on Vue reactive proxies.
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(toRaw(v))) as T
}

export type Mode =
  | 'select'
  | { kind: 'place'; elementKind: ElementKind }
  | { kind: 'polyline'; elementKind: 'arcRail' | 'gateRail'; points: Array<{ x: number; y: number }> }

export const useEditorStore = defineStore('editor', () => {
  const store = new LayoutStore()
  const layout = ref<Layout>(newBlankLayout())
  const selectedId = ref<string | undefined>(undefined)
  const mode = ref<Mode>('select')
  const history = new History<Layout>(100)
  history.push(clone(layout.value))

  function setLayout(next: Layout): void {
    layout.value = next
    selectedId.value = undefined
    history.push(clone(next))
  }

  function commit(): void {
    history.push(clone(layout.value))
    store.save(layout.value)
  }

  function addElement(e: Element): void {
    layout.value.elements.push(e)
    selectedId.value = e.id
    commit()
  }

  function updateSelected(patch: Partial<Element>): void {
    const i = layout.value.elements.findIndex((x) => x.id === selectedId.value)
    if (i < 0) return
    const merged = { ...layout.value.elements[i], ...patch } as Element
    layout.value.elements.splice(i, 1, merged)
    commit()
  }

  function deleteSelected(): void {
    if (!selectedId.value) return
    layout.value.elements = layout.value.elements.filter((e) => e.id !== selectedId.value)
    selectedId.value = undefined
    commit()
  }

  function undo(): void {
    const prev = history.undo()
    if (prev) layout.value = clone(prev)
  }

  function redo(): void {
    const next = history.redo()
    if (next) layout.value = clone(next)
  }

  function loadLayout(id: string): void {
    const found = store.get(id)
    if (!found) return
    setLayout(found)
  }

  function newLayout(): void {
    setLayout(newBlankLayout())
    store.save(layout.value)
  }

  function rename(name: string): void {
    layout.value.name = name
    commit()
  }

  function testPlay(): void {
    store.saveDraft(layout.value)
    window.open('/play?layout=__draft__', '_blank')
  }

  const selected = computed(() =>
    layout.value.elements.find((e) => e.id === selectedId.value),
  )

  return {
    layout,
    selectedId,
    selected,
    mode,
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
    listLayouts: () => store.list(),
    duplicate: (id: string) => store.duplicate(id),
    remove: (id: string) => store.remove(id),
  }
})
