import { useCallback, useMemo, useRef, useState } from 'react'
import cards from '../data/cards.json'
import { today as getToday } from '../lib/date.js'
import { clearState, createEmptyState, loadState, saveState } from '../lib/storage.js'
import { LearningContext } from './learningContext.js'

const cardsById = Object.fromEntries(cards.map((c) => [c.id, c]))

export default function LearningProvider({ children }) {
  const [initial] = useState(loadState)
  const [state, setState] = useState(initial.state)
  const [storageOk, setStorageOk] = useState(initial.ok)
  const stateRef = useRef(state)

  // 모든 변경은 update(fn)로: 순수 함수 fn(prev) → next, 그리고 즉시 저장
  const update = useCallback((fn) => {
    const next = fn(stateRef.current)
    stateRef.current = next
    setState(next)
    setStorageOk(saveState(next))
    return next
  }, [])

  const reset = useCallback(() => {
    clearState()
    const empty = createEmptyState()
    stateRef.current = empty
    setState(empty)
    setStorageOk(saveState(empty))
  }, [])

  const value = useMemo(
    () => ({ state, storageOk, today: getToday(), cards, cardsById, update, reset }),
    [state, storageOk, update, reset],
  )

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
}
