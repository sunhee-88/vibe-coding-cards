import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyState, loadState, saveState, STORAGE_KEY } from '../src/lib/storage.js'

function fakeStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('storage', () => {
  it('저장한 상태를 그대로 불러온다', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    const state = createEmptyState()
    state.streak.count = 4
    expect(saveState(state)).toBe(true)
    expect(loadState()).toEqual({ state, ok: true })
  })

  it('빠진 필드는 기본값으로 채운다', () => {
    const storage = fakeStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ cards: { api: { level: 2 } } }))
    vi.stubGlobal('localStorage', storage)
    const { state } = loadState()
    expect(state.settings.dailyNew).toBe(5)
    expect(state.cards.api.level).toBe(2)
  })

  it('localStorage가 throw해도 멈추지 않고 ok:false', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadState()).toEqual({ state: createEmptyState(), ok: false })
    expect(saveState(createEmptyState())).toBe(false)
  })

  it('깨진 JSON이면 빈 상태로 시작', () => {
    const storage = fakeStorage()
    storage.setItem(STORAGE_KEY, '{oops')
    vi.stubGlobal('localStorage', storage)
    expect(loadState().ok).toBe(false)
  })
})
