// 홈·기록 화면용 집계 (PRD 9장 측정 계획)
import { addDays } from './date.js'
import { isDue } from './leitner.js'

export function countDue(state, today) {
  return Object.values(state.cards).filter((c) => isDue(c, today)).length
}

export function countMastered(state) {
  return Object.values(state.cards).filter((c) => c.mastered).length
}

export function countDueTomorrow(state, today) {
  const tomorrow = addDays(today, 1)
  return Object.values(state.cards).filter((c) => isDue(c, tomorrow)).length
}

/** 7일 유지율 — Lv4(7일 간격)에서 받은 복습의 정답률. 기록이 없으면 null */
export function retentionRate(state) {
  const attempts = Object.values(state.cards)
    .flatMap((c) => c.history ?? [])
    .filter((h) => h.lv === 4)
  if (!attempts.length) return null
  return Math.round((attempts.filter((h) => h.ok).length / attempts.length) * 100)
}

/** 확신 오답률 — '확신'이라고 답한 것 중 틀린 비율 */
export function confidentMissRate(state) {
  const sure = Object.values(state.cards)
    .flatMap((c) => c.history ?? [])
    .filter((h) => h.conf === 'sure')
  if (!sure.length) return null
  return Math.round((sure.filter((h) => !h.ok).length / sure.length) * 100)
}

/** 레벨 분포: { 1..5, M } */
export function levelDistribution(state) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, M: 0 }
  for (const c of Object.values(state.cards)) {
    if (c.mastered) dist.M += 1
    else if (c.level >= 1) dist[c.level] += 1
  }
  return dist
}

export function seenCountByStage(state, cards) {
  const out = {}
  for (const card of cards) {
    if (state.cards[card.id]) out[card.stage] = (out[card.stage] ?? 0) + 1
  }
  return out
}
