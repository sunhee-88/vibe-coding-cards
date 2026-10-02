import { describe, expect, it } from 'vitest'
import cards from '../src/data/cards.json'
import { addDays } from '../src/lib/date.js'
import { createCardState } from '../src/lib/leitner.js'
import { createRng } from '../src/lib/random.js'
import {
  answerCurrent,
  buildSession,
  completeIntro,
  finishSession,
  interleaveByStage,
  isSessionFinished,
  MAX_REVIEWS,
  planToday,
} from '../src/lib/session.js'
import { createEmptyState } from '../src/lib/storage.js'

const DAY1 = '2026-10-01'

// 세션 하나를 끝까지 진행한다. answerFn(item) → 정답 여부
function playSession(state, today, answerFn = () => true, confidence = 'sure') {
  let s = { ...state, session: buildSession(state, cards, today, createRng(today)) }
  let guard = 0
  while (!isSessionFinished(s.session)) {
    const item = s.session.items[s.session.index]
    if (item.kind === 'intro') s = completeIntro(s, today)
    else
      s = answerCurrent(s, { correct: answerFn(item), confidence, questionType: 'Q1' }, today).state
    if (++guard > 500) throw new Error('세션이 끝나지 않음')
  }
  return finishSession(s, today)
}

describe('buildSession — 첫날', () => {
  const session = buildSession(createEmptyState(), cards, DAY1, createRng(1))

  it('새 카드 5장, PDF 단계 순서대로', () => {
    const intros = session.items.filter((i) => i.kind === 'intro').map((i) => i.cardId)
    expect(intros).toEqual(cards.slice(0, 5).map((c) => c.id))
  })

  it('새 카드마다 소개 → 즉시 Q1(채점) → 2개 이상 뒤 Q1 재출제(연습)', () => {
    for (const id of cards.slice(0, 5).map((c) => c.id)) {
      const idx = session.items.map((it, i) => (it.cardId === id ? i : -1)).filter((i) => i >= 0)
      expect(idx).toHaveLength(3)
      expect(session.items[idx[0]].kind).toBe('intro')
      expect(idx[1]).toBe(idx[0] + 1)
      expect(session.items[idx[1]].graded).toBe(true)
      expect(idx[2] - idx[1]).toBeGreaterThanOrEqual(3)
      expect(session.items[idx[2]].graded).toBe(false)
    }
  })
})

describe('세션 진행', () => {
  it('틀린 카드는 같은 세션 끝에 재도전으로 다시 나온다', () => {
    let s = { ...createEmptyState() }
    s.session = buildSession(s, cards, DAY1, createRng(1))
    s = completeIntro(s, DAY1)
    s = answerCurrent(s, { correct: false, confidence: 'sure', questionType: 'Q1' }, DAY1).state
    while (!isSessionFinished(s.session)) {
      const item = s.session.items[s.session.index]
      s =
        item.kind === 'intro'
          ? completeIntro(s, DAY1)
          : answerCurrent(s, { correct: true, confidence: 'sure', questionType: 'Q1' }, DAY1).state
    }
    const retry = s.session.items.filter((i) => i.phase === 'retry')
    expect(retry.map((i) => i.cardId)).toEqual([cards[0].id])
    expect(retry[0].graded).toBe(false)
  })

  it('같은 날 다시 열면 새 카드가 더 나오지 않는다', () => {
    const after = playSession(createEmptyState(), DAY1)
    const plan = planToday(after, cards, DAY1)
    expect(plan.fresh).toHaveLength(0)
    expect(plan.reviews).toHaveLength(0)
  })

  it('세션을 끝내면 연속 학습일 1, 요약 저장', () => {
    const after = playSession(createEmptyState(), DAY1)
    expect(after.streak.count).toBe(1)
    expect(after.lastSummary.introducedIds).toHaveLength(5)
    expect(after.lastSummary.tomorrowCount).toBe(5)
    expect(after.session).toBeNull()
  })
})

describe('복습 큐 규칙', () => {
  function stateWithDue(n, today, extra = () => ({})) {
    const s = createEmptyState()
    cards.slice(0, n).forEach((c, i) => {
      s.cards[c.id] = { ...createCardState(), level: 2, due: addDays(today, -(i % 3)), ...extra(i) }
    })
    return s
  }

  it('복습은 최대 20장, 넘치면 새 카드는 2장', () => {
    const s = stateWithDue(25, DAY1)
    const plan = planToday(s, cards, DAY1)
    expect(plan.reviews).toHaveLength(MAX_REVIEWS)
    expect(plan.dueTotal).toBe(25)
    expect(plan.fresh).toHaveLength(2)
  })

  it('확신 오답 카드가 복습 맨 앞에 온다 (spec 10장 ④)', () => {
    const s = stateWithDue(10, DAY1, (i) => ({ confidentMiss: i === 7 }))
    const session = buildSession(s, cards, DAY1, createRng(3))
    expect(session.items[0].cardId).toBe(cards[7].id)
  })

  it('같은 단계가 3장 연속으로 나오지 않는다 (가능한 경우)', () => {
    const picked = cards.filter((c) => c.stage <= 3)
    const out = interleaveByStage(picked, createRng(9))
    for (let i = 2; i < out.length; i++) {
      const run = out[i].stage === out[i - 1].stage && out[i].stage === out[i - 2].stage
      expect(run).toBe(false)
    }
  })
})

describe('14일 시뮬레이션 (spec 10장 ②)', () => {
  it('매일 모두 맞히면 첫 카드 간격이 1 → 2 → 4 → 7일로 늘고, 하루 5장씩 14일간 70장 소개', () => {
    let s = createEmptyState()
    const first = cards[0].id
    const firstDue = []
    for (let d = 0; d < 14; d++) {
      const today = addDays(DAY1, d)
      const before = s.cards[first]?.due
      s = playSession(s, today)
      if (s.cards[first].due !== before) firstDue.push(s.cards[first].due)
    }
    // 소개일 +1, +2, +4, +7 (14일 간격은 13일 차에 시작해 기간 밖)
    expect(firstDue).toEqual(['2026-10-02', '2026-10-04', '2026-10-08', '2026-10-15'])
    expect(Object.keys(s.cards)).toHaveLength(Math.min(cards.length, 14 * 5))
    expect(s.streak.count).toBe(14)
  })

  it('"먼저 배울 단계"를 정하면 그 단계 카드부터 새 카드로 나온다', () => {
    const s = createEmptyState()
    s.settings.focusStage = 9
    const plan = planToday(s, cards, DAY1)
    expect(plan.fresh).toHaveLength(5)
    expect(plan.fresh.every((c) => c.stage === 9)).toBe(true)
  })

  it('먼저 배울 단계를 다 배우면 원래 단계 순서로 이어진다', () => {
    const s = createEmptyState()
    s.settings.focusStage = 9
    for (const c of cards.filter((c) => c.stage === 9)) {
      s.cards[c.id] = { ...createCardState(), level: 1, due: addDays(DAY1, 5) }
    }
    expect(planToday(s, cards, DAY1).fresh[0].stage).toBe(1)
  })

  it('오답이면 Lv1로 돌아가 다음 날 다시 나온다', () => {
    let s = playSession(createEmptyState(), DAY1)
    const target = cards[0].id
    s = playSession(
      s,
      addDays(DAY1, 1),
      (item) => item.cardId !== target || item.phase !== 'review',
    )
    expect(s.cards[target].level).toBe(1)
    expect(s.cards[target].due).toBe(addDays(DAY1, 2))
  })
})
