import { afterEach, describe, expect, it } from 'vitest'
import { addDays, diffDays, setNow, today } from '../src/lib/date.js'

afterEach(() => setNow(null))

describe('today() — 새벽 4시 기준', () => {
  it('03:59는 전날로 친다', () => {
    expect(today(new Date(2026, 8, 30, 3, 59))).toBe('2026-09-29')
  })

  it('04:00부터 당일이다', () => {
    expect(today(new Date(2026, 8, 30, 4, 0))).toBe('2026-09-30')
  })

  it('setNow()로 고정한 시각을 쓴다', () => {
    setNow(new Date(2026, 9, 1, 12, 0))
    expect(today()).toBe('2026-10-01')
  })
})

describe('addDays / diffDays', () => {
  it('월 경계를 넘는다', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-09-30', 14)).toBe('2026-10-14')
  })

  it('두 날짜 사이 일수', () => {
    expect(diffDays('2026-09-30', '2026-10-04')).toBe(4)
  })
})
