// 문제·보기 생성 Q1~Q5 (spec 4.4)
import { shuffle } from './random.js'

export const QUESTION_LABEL = {
  Q1: '이 비유에 맞는 용어는?',
  Q2: '이 용어의 뜻은?',
  Q3: '이 설명에 맞는 용어는?',
  Q4: 'AI가 이렇게 말했어요',
  Q5: '이 설명에 맞는 용어를 입력하세요',
}

/** 카드 레벨에 맞는 문제 유형 (spec 4.1 문제 사다리) */
export function pickQuestionType(card, cardState, rng) {
  const level = cardState?.level ?? 0
  if (cardState?.mastered) {
    const pool = card.situation ? ['Q3', 'Q4', 'Q5'] : ['Q3', 'Q5']
    return pool[Math.floor(rng() * pool.length)]
  }
  if (level <= 1) return 'Q1'
  if (level === 2) return 'Q2'
  if (level === 3) return 'Q3'
  if (level === 4) return card.situation ? 'Q4' : 'Q3'
  return 'Q5'
}

// 같은 단계 → 가까운 단계 순으로 후보를 모은다. 같은 거리 안에서는 무작위.
function byStageDistance(card, pool, rng) {
  return shuffle(pool, rng).sort(
    (a, b) => Math.abs(a.stage - card.stage) - Math.abs(b.stage - card.stage),
  )
}

function pickDistractors(card, cards, type, rng) {
  const others = cards.filter((c) => c.id !== card.id && c.term !== card.term)

  if (type === 'Q1') {
    // 쉬운 단계: 다른 단계 카드에서
    const otherStage = shuffle(
      others.filter((c) => c.stage !== card.stage),
      rng,
    )
    return otherStage.slice(0, 3)
  }

  const picked = []
  if (type === 'Q3') {
    // 헷갈리는 짝을 1~2개 섞는다 (섞어 풀기, spec 4.4)
    const confusables = shuffle(
      others.filter((c) => card.confusableWith?.includes(c.id)),
      rng,
    )
    picked.push(...confusables.slice(0, 2))
  }
  for (const c of byStageDistance(card, others, rng)) {
    if (picked.length >= 3) break
    if (!picked.includes(c)) picked.push(c)
  }
  return picked
}

/**
 * @returns {{ type, cardId, label, prompt, sub, mode: 'choice'|'input', options?, hint? }}
 * options: [{ id, text, correct, cardId? }]
 */
export function buildQuestion(card, cards, type, rng) {
  const base = { type, cardId: card.id, label: QUESTION_LABEL[type] }

  if (type === 'Q4' && card.situation) {
    const { aiSays, question, answer, distractors } = card.situation
    const options = shuffle(
      [
        { id: 'answer', text: answer, correct: true },
        ...distractors.map((text, i) => ({ id: `d${i}`, text, correct: false })),
      ],
      rng,
    )
    return { ...base, prompt: aiSays, sub: question, mode: 'choice', options }
  }

  if (type === 'Q5') {
    return {
      ...base,
      prompt: card.definition,
      sub: null,
      mode: 'input',
      hint: buildHint(card.term),
    }
  }

  const distractors = pickDistractors(card, cards, type, rng)
  const textOf = (c) => (type === 'Q2' ? c.definition : c.term)
  const options = shuffle(
    [card, ...distractors].map((c) => ({
      id: c.id,
      cardId: c.id,
      text: textOf(c),
      correct: c.id === card.id,
    })),
    rng,
  )

  const prompt = { Q1: card.analogy, Q2: card.term, Q3: card.definition }[type]
  const sub = type === 'Q2' ? card.termFull : null
  return { ...base, prompt, sub, mode: 'choice', options }
}

const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'

function firstLetter(ch) {
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) return CHOSEONG[Math.floor((code - 0xac00) / 588)]
  return ch.toUpperCase()
}

/** 첫 글자(한글은 초성)만 보여 주고 나머지는 글자 수만큼 빈칸 — 예: "ㄹ _ _ _ _" */
export function buildHint(term) {
  const chars = [...term.replace(/\s/g, '')]
  return [firstLetter(chars[0]), ...chars.slice(1).map(() => '_')].join(' ')
}

export function normalizeAnswer(text) {
  return text
    .toLowerCase()
    .replace(/[\s·/\-()._→>]/g, '')
    .trim()
}

export function checkTypedAnswer(input, card) {
  const given = normalizeAnswer(input)
  if (!given) return false
  const accepted = [card.term, ...(card.aliases ?? [])].map(normalizeAnswer)
  return accepted.includes(given)
}
