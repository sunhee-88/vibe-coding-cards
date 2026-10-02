// 하루 세션 — 큐 구성과 진행 (spec 4.3)
//
// 세션 항목(item): { kind: 'intro' | 'question', cardId, phase: 'review' | 'new' | 'retry', graded }
//  - graded: 레벨에 반영되는 채점인지. 새 카드의 두 번째 Q1과 재도전은 연습이라 반영하지 않는다.
import { grade } from './leitner.js'
import { createRng, shuffle } from './random.js'
import { updateStreak } from './streak.js'
import { countDueTomorrow } from './stats.js'
import { now } from './date.js'

export const MAX_REVIEWS = 20
export const REDUCED_NEW_CARDS = 2
export const REPEAT_LAG = 2 // 새 카드 두 번째 출제를 몇 카드 뒤에 붙일지

/** 같은 단계 카드가 3장 이상 연달아 나오지 않게 섞는다 (섞어 풀기) */
export function interleaveByStage(cards, rng) {
  const pool = shuffle(cards, rng)
  const out = []
  while (pool.length) {
    const [a, b] = out.slice(-2)
    const blocked = a && b && a.stage === b.stage ? a.stage : null
    const idx = pool.findIndex((c) => c.stage !== blocked)
    out.push(pool.splice(idx === -1 ? 0 : idx, 1)[0])
  }
  return out
}

function introducedToday(state, today) {
  return state.daily?.day === today ? state.daily.newIds.length : 0
}

/** 오늘 할 복습·새 카드 목록 (홈 화면 숫자와 세션 구성에 같이 쓴다) */
export function planToday(state, cards, today) {
  const due = cards
    .filter((c) => state.cards[c.id]?.due && state.cards[c.id].due <= today)
    .sort((a, b) => {
      const sa = state.cards[a.id]
      const sb = state.cards[b.id]
      if (sa.confidentMiss !== sb.confidentMiss) return sa.confidentMiss ? -1 : 1
      return sa.due.localeCompare(sb.due)
    })
  const reviews = due.slice(0, MAX_REVIEWS)

  const dailyNew = reviews.length >= MAX_REVIEWS ? REDUCED_NEW_CARDS : state.settings.dailyNew
  const newLimit = Math.max(0, dailyNew - introducedToday(state, today))
  // 기본은 단계 순서(= PDF 로드맵). "먼저 배울 단계"를 정했으면 그 단계 카드부터.
  const focus = state.settings.focusStage
  const rank = (c) => (c.stage === focus ? 0 : c.stage)
  const fresh = cards
    .filter((c) => !state.cards[c.id])
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, newLimit)

  return { reviews, fresh, dueTotal: due.length }
}

export function buildSession(state, cards, today, rng) {
  const { reviews, fresh } = planToday(state, cards, today)

  // 확신 오답은 복습 맨 앞 (spec 4.3), 나머지는 섞어서
  const urgent = reviews.filter((c) => state.cards[c.id].confidentMiss)
  const rest = reviews.filter((c) => !state.cards[c.id].confidentMiss)
  const reviewItems = [...interleaveByStage(urgent, rng), ...interleaveByStage(rest, rng)].map(
    (c) => ({ kind: 'question', cardId: c.id, phase: 'review', graded: true }),
  )

  // 새 카드: 소개 → 즉시 Q1 → 다른 항목 2~4개 뒤 Q1 한 번 더.
  // 재출제를 두 카드 늦게 붙이면 마지막 카드도 사이에 2개 이상이 끼인다:
  // I1 Q1 | I2 Q2 | I3 Q3 R1 | I4 Q4 R2 | I5 Q5 R3 | R4 R5
  const newItems = []
  const repeat = (c) => ({ kind: 'question', cardId: c.id, phase: 'new', graded: false })
  fresh.forEach((c, i) => {
    newItems.push({ kind: 'intro', cardId: c.id, phase: 'new', graded: false })
    newItems.push({ kind: 'question', cardId: c.id, phase: 'new', graded: true })
    if (i >= REPEAT_LAG) newItems.push(repeat(fresh[i - REPEAT_LAG]))
  })
  fresh.slice(-REPEAT_LAG).forEach((c) => newItems.push(repeat(c)))

  return {
    day: today,
    items: [...reviewItems, ...newItems],
    index: 0,
    results: [],
    wrongIds: [],
    introducedIds: [],
    retryAdded: false,
    startedAt: now().toISOString(),
  }
}

/** 오늘 세션을 새로 만들어 상태에 넣는다. 시드는 날짜 + 누적 세션 수 → 새로고침해도 같은 순서 */
export function startSession(state, cards, today) {
  const rng = createRng(`${today}:${state.stats.sessions}`)
  return { ...state, session: buildSession(state, cards, today, rng) }
}

/** 진행 중인 오늘 세션 (날짜가 바뀌었으면 버린다) */
export function activeSession(state, today) {
  return state.session?.day === today ? state.session : null
}

export function isSessionFinished(session) {
  return session.index >= session.items.length
}

// 마지막 항목을 넘기면 오늘 틀린 카드를 재도전으로 한 번 더 붙인다 (spec 4.3 ③)
function advance(session) {
  const next = { ...session, index: session.index + 1 }
  if (next.index >= next.items.length && !next.retryAdded && next.wrongIds.length) {
    next.items = [
      ...next.items,
      ...next.wrongIds.map((id) => ({
        kind: 'question',
        cardId: id,
        phase: 'retry',
        graded: false,
      })),
    ]
    next.retryAdded = true
  }
  return next
}

/** 새 카드 소개 화면에서 [기억했어요] */
export function completeIntro(state, today) {
  const session = state.session
  const item = session.items[session.index]
  const daily = state.daily?.day === today ? state.daily : { day: today, newIds: [] }
  return {
    ...state,
    daily: { day: today, newIds: [...new Set([...daily.newIds, item.cardId])] },
    session: advance({
      ...session,
      introducedIds: [...new Set([...session.introducedIds, item.cardId])],
    }),
  }
}

/**
 * 현재 문제에 답한다. 채점 대상이면 카드 레벨을 갱신하고 다음 항목으로 넘어간다.
 * @returns {{ state, result }} result: { cardId, correct, confidence, graded, from, to, phase }
 */
export function answerCurrent(state, { correct, confidence, questionType }, today) {
  const session = state.session
  const item = session.items[session.index]
  let cards = state.cards
  let result = {
    cardId: item.cardId,
    correct,
    confidence,
    questionType,
    graded: item.graded,
    phase: item.phase,
  }

  if (item.graded) {
    const graded = grade(state.cards[item.cardId], { correct, confidence, today, questionType })
    cards = { ...cards, [item.cardId]: graded.state }
    result = { ...result, from: graded.from, to: graded.to }
  }

  const wrongIds =
    !correct && item.phase !== 'retry' && !session.wrongIds.includes(item.cardId)
      ? [...session.wrongIds, item.cardId]
      : session.wrongIds

  return {
    state: {
      ...state,
      cards,
      session: advance({ ...session, wrongIds, results: [...session.results, result] }),
    },
    result,
  }
}

/** 세션 종료 — 요약 저장, 연속 학습일·통계 갱신 */
export function finishSession(state, today) {
  const session = state.session
  const graded = session.results.filter((r) => r.graded)
  const levelUps = graded
    .filter((r) => r.correct && r.phase === 'review')
    .map(({ cardId, from, to }) => ({ cardId, from, to }))
  const confidentMissIds = [
    ...new Set(graded.filter((r) => !r.correct && r.confidence === 'sure').map((r) => r.cardId)),
  ]
  const minutes = Math.max(1, Math.round((now() - new Date(session.startedAt)) / 60000))
  const streak = updateStreak(state.streak, today)

  const summary = {
    day: today,
    answered: session.results.length,
    correct: session.results.filter((r) => r.correct).length,
    introducedIds: session.introducedIds,
    levelUps,
    confidentMissIds,
    wrongIds: session.wrongIds,
    minutes,
    streak: streak.count,
  }
  const next = {
    ...state,
    session: null,
    streak,
    stats: {
      sessions: state.stats.sessions + 1,
      totalMinutes: state.stats.totalMinutes + minutes,
    },
  }
  return { ...next, lastSummary: { ...summary, tomorrowCount: countDueTomorrow(next, today) } }
}
