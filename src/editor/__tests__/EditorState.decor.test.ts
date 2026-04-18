import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../EditorState'
import { newBlankLayout } from '../boilerplate'

describe('EditorState decor', () => {
  beforeEach(() => {
    const store = useEditorStore()
    store.setLayout(newBlankLayout())
  })

  it('addDecor pushes to decorations and selects it', () => {
    const store = useEditorStore()
    store.addDecor({
      id: 'd1',
      kind: 'light',
      x: 100,
      y: 100,
      r: 30,
      color: '#ff66cc',
      intensity: 0.6,
    })
    expect(store.layout.decorations?.length).toBe(1)
    expect(store.layout.decorations?.[0].id).toBe('d1')
    expect(store.selectedId).toBe('d1')
  })

  it('updateDecor patches the selected decor', () => {
    const store = useEditorStore()
    store.addDecor({
      id: 'd2',
      kind: 'light',
      x: 100,
      y: 100,
      r: 30,
      color: '#ff66cc',
      intensity: 0.6,
    })
    store.updateDecor({ x: 200 })
    expect(store.layout.decorations?.[0].x).toBe(200)
  })

  it('deleteSelected removes a selected decor', () => {
    const store = useEditorStore()
    store.addDecor({
      id: 'd3',
      kind: 'light',
      x: 100,
      y: 100,
      r: 30,
      color: '#ff66cc',
      intensity: 0.6,
    })
    store.deleteSelected()
    expect(store.layout.decorations?.length).toBe(0)
  })

  it('paletteTab toggles between tools and beauty', () => {
    const store = useEditorStore()
    expect(store.state.paletteTab).toBe('tools')
    store.state.paletteTab = 'beauty'
    expect(store.state.paletteTab).toBe('beauty')
  })
})
