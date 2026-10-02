import { describe, expect, it } from 'vitest'
import cards from '../src/data/cards.json'
import {
  buildHint,
  buildQuestion,
  checkTypedAnswer,
  pickQuestionType,
} from '../src/lib/questions.js'
import { createRng } from '../src/lib/random.js'

const byId = Object.fromEntries(cards.map((c) => [c.id, c]))

describe('pickQuestionType', () => {
  const rng = createRng(1)
  it('레벨별 문제 사다리', () => {
    const was = byId.was
    expect(pickQuestionType(was, undefined, rng)).toBe('Q1')
    expect(pickQuestionType(was, { level: 1 }, rng)).toBe('Q1')
    expect(pickQuestionType(was, { level: 2 }, rng)).toBe('Q2')
    expect(pickQuestionType(was, { level: 3 }, rng)).toBe('Q3')
    expect(pickQuestionType(was, { level: 4 }, rng)).toBe('Q4')
    expect(pickQuestionType(was, { level: 5 }, rng)).toBe('Q5')
  })
})

describe('buildQuestion — 모든 카드 × Q1~Q4', () => {
  for (const type of ['Q1', 'Q2', 'Q3', 'Q4']) {
    it(`${type}: 보기 4개, 중복 없음, 정답 1개`, () => {
      for (const card of cards) {
        const q = buildQuestion(card, cards, type, createRng(`${card.id}:${type}`))
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options.map((o) => o.text)).size).toBe(4)
        expect(q.options.filter((o) => o.correct)).toHaveLength(1)
      }
    })
  }

  it('Q1 오답 보기는 다른 단계 카드', () => {
    for (const card of cards) {
      const q = buildQuestion(card, cards, 'Q1', createRng(card.id))
      for (const o of q.options.filter((o) => !o.correct)) {
        expect(byId[o.cardId].stage).not.toBe(card.stage)
      }
    }
  })

  it('Q3 보기에는 헷갈리는 짝이 최소 1개 들어간다 (spec 10장 ③)', () => {
    for (const card of cards.filter((c) => c.confusableWith.length)) {
      for (let seed = 0; seed < 5; seed++) {
        const q = buildQuestion(card, cards, 'Q3', createRng(`${card.id}:${seed}`))
        const hasPair = q.options.some((o) => card.confusableWith.includes(o.cardId))
        expect(hasPair, card.id).toBe(true)
      }
    }
  })

  it('같은 시드면 같은 문제', () => {
    const a = buildQuestion(byId.api, cards, 'Q3', createRng('x'))
    const b = buildQuestion(byId.api, cards, 'Q3', createRng('x'))
    expect(a).toEqual(b)
  })
})

describe('Q5 입력형', () => {
  it('힌트는 첫 글자(초성) + 빈칸', () => {
    expect(buildHint('로드 밸런서')).toBe('ㄹ _ _ _ _')
    expect(buildHint('CDN')).toBe('C _ _')
  })

  it('띄어쓰기·대소문자 무시, 별칭 허용', () => {
    expect(checkTypedAnswer('로드밸런서', byId['load-balancer'])).toBe(true)
    expect(checkTypedAnswer('Load Balancer', byId['load-balancer'])).toBe(true)
    expect(checkTypedAnswer('cdn', byId.cdn)).toBe(true)
    expect(checkTypedAnswer('캐시', byId.cdn)).toBe(false)
    expect(checkTypedAnswer('  ', byId.cdn)).toBe(false)
  })
})
