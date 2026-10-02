import { describe, expect, it } from 'vitest'
import { createCardState, grade, HISTORY_LIMIT } from '../src/lib/leitner.js'

const TODAY = '2026-10-01'
const at = (level, extra = {}) => ({ ...createCardState(), level, ...extra })

describe('grade() — 정답', () => {
  it('새 카드(Lv0)는 Lv1, 다음 날 복습', () => {
    const { state } = grade(createCardState(), { correct: true, confidence: 'sure', today: TODAY })
    expect(state.level).toBe(1)
    expect(state.due).toBe('2026-10-02')
  })

  it('레벨이 오를수록 간격이 1 → 2 → 4 → 7 → 14일', () => {
    const due = []
    let s = createCardState()
    for (let i = 0; i < 5; i++) {
      s = grade(s, { correct: true, confidence: 'sure', today: TODAY }).state
      due.push(s.due)
    }
    expect(due).toEqual(['2026-10-02', '2026-10-03', '2026-10-05', '2026-10-08', '2026-10-15'])
  })

  it('애매 + 정답이면 레벨은 오르되 간격은 한 단계 짧게', () => {
    const { state } = grade(at(2), { correct: true, confidence: 'unsure', today: TODAY })
    expect(state.level).toBe(3)
    expect(state.due).toBe('2026-10-03') // Lv2 간격(2일)
  })

  it('D1: Lv5에서 맞히면 마스터, 30일 뒤 점검', () => {
    const { state, to } = grade(at(5), { correct: true, confidence: 'sure', today: TODAY })
    expect(state.mastered).toBe(true)
    expect(to).toBe('M')
    expect(state.due).toBe('2026-10-31')
  })

  it('D3: 확신 오답 표시는 다음 정답에서 해제', () => {
    const { state } = grade(at(1, { confidentMiss: true }), {
      correct: true,
      confidence: 'sure',
      today: TODAY,
    })
    expect(state.confidentMiss).toBe(false)
  })
})

describe('grade() — 오답', () => {
  it('확신 + 오답 → Lv1, 확신 오답 표시', () => {
    const { state } = grade(at(4), { correct: false, confidence: 'sure', today: TODAY })
    expect(state.level).toBe(1)
    expect(state.confidentMiss).toBe(true)
    expect(state.lapses).toBe(1)
    expect(state.due).toBe('2026-10-02')
  })

  it('애매 + 오답 → Lv1, 확신 오답 아님', () => {
    const { state } = grade(at(4), { correct: false, confidence: 'unsure', today: TODAY })
    expect(state.level).toBe(1)
    expect(state.confidentMiss).toBe(false)
  })

  it('모름 + 오답 → 한 단계만 내림', () => {
    const { state } = grade(at(4), { correct: false, confidence: 'unknown', today: TODAY })
    expect(state.level).toBe(3)
  })

  it('모름 + 오답이어도 Lv1 아래로는 안 내려감', () => {
    const { state } = grade(at(1), { correct: false, confidence: 'unknown', today: TODAY })
    expect(state.level).toBe(1)
  })

  it('D2: 마스터 점검에서 틀리면 마스터 해제, Lv3', () => {
    const { state } = grade(at(5, { mastered: true }), {
      correct: false,
      confidence: 'unsure',
      today: TODAY,
    })
    expect(state.mastered).toBe(false)
    expect(state.level).toBe(3)
  })
})

describe('grade() — 기록', () => {
  it(`history는 최근 ${HISTORY_LIMIT}개만 유지`, () => {
    let s = createCardState()
    for (let i = 0; i < HISTORY_LIMIT + 1; i++) {
      s = grade(s, { correct: i % 2 === 0, confidence: 'sure', today: TODAY }).state
    }
    expect(s.history).toHaveLength(HISTORY_LIMIT)
    expect(s.reviews).toBe(HISTORY_LIMIT + 1)
  })

  it('원본 상태를 바꾸지 않는다', () => {
    const prev = at(2)
    grade(prev, { correct: true, confidence: 'sure', today: TODAY })
    expect(prev.level).toBe(2)
  })
})
