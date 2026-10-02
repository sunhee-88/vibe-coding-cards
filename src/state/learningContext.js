import { createContext, useContext } from 'react'

export const LearningContext = createContext(null)

/** { state, storageOk, today, cards, cardsById, update, reset } */
export function useLearning() {
  const ctx = useContext(LearningContext)
  if (!ctx) throw new Error('useLearning은 LearningProvider 안에서만 쓸 수 있어요')
  return ctx
}
