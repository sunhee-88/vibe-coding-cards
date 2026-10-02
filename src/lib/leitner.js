// 라이트너 5상자 — 레벨 변화와 다음 복습일 (spec 4.1, 4.2 / todo.md D1~D3)
import { addDays } from './date.js'

// 레벨별 다음 복습까지 일수
export const INTERVAL_DAYS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 }
export const MASTER_INTERVAL = 30
export const MASTER_FAIL_LEVEL = 3 // D2: 마스터 점검에서 틀리면 Lv3으로
export const HISTORY_LIMIT = 20

export const CONFIDENCE = { SURE: 'sure', UNSURE: 'unsure', UNKNOWN: 'unknown' }

export function createCardState() {
  return {
    level: 0,
    due: null,
    mastered: false,
    confidentMiss: false,
    lapses: 0,
    reviews: 0,
    lastSeen: null,
    history: [],
  }
}

/**
 * 한 번의 채점 결과를 카드 상태에 반영한다. 원본은 바꾸지 않는다.
 * @returns {{ state, from, to }} from/to는 레벨 (마스터는 'M')
 */
export function grade(prev, { correct, confidence, today, questionType }) {
  const s = { ...createCardState(), ...prev }
  const from = s.mastered ? 'M' : s.level
  let interval

  if (correct) {
    s.confidentMiss = false // D3: 다음 정답 시 해제
    if (s.mastered) {
      interval = MASTER_INTERVAL
    } else if (s.level >= 5) {
      // D1: Lv5(14일 간격) 복습을 맞히면 마스터 → 30일 뒤 점검
      s.mastered = true
      interval = MASTER_INTERVAL
    } else {
      s.level = Math.max(1, s.level + 1)
      // 애매하게 맞히면 레벨은 올리되 간격은 한 단계 낮은 기준 (spec 4.2)
      const intervalLevel = confidence === CONFIDENCE.UNSURE ? Math.max(1, s.level - 1) : s.level
      interval = INTERVAL_DAYS[intervalLevel]
    }
  } else {
    if (s.mastered) {
      s.mastered = false
      s.level = MASTER_FAIL_LEVEL
    } else if (confidence === CONFIDENCE.UNKNOWN) {
      s.level = Math.max(1, s.level - 1)
    } else {
      s.level = 1
    }
    if (confidence === CONFIDENCE.SURE) s.confidentMiss = true
    s.lapses += 1
    interval = 1
  }

  s.due = addDays(today, interval)
  s.reviews += 1
  s.lastSeen = today
  s.history = [
    ...s.history,
    { d: today, q: questionType, ok: correct, conf: confidence, lv: from },
  ].slice(-HISTORY_LIMIT)

  return { state: s, from, to: s.mastered ? 'M' : s.level }
}

export function isDue(cardState, today) {
  return Boolean(cardState && cardState.due && cardState.due <= today)
}
