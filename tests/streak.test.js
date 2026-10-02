import { describe, expect, it } from 'vitest'
import { currentStreak, updateStreak } from '../src/lib/streak.js'

const start = { count: 0, lastDay: null, freezeLeft: 1 }

describe('updateStreak', () => {
  it('첫 세션은 1일', () => {
    expect(updateStreak(start, '2026-10-01').count).toBe(1)
  })

  it('하루에 여러 번 해도 한 번만 오른다', () => {
    const s = updateStreak(start, '2026-10-01')
    expect(updateStreak(s, '2026-10-01')).toBe(s)
  })

  it('다음 날 이어서 하면 +1', () => {
    const s = { count: 3, lastDay: '2026-10-01', freezeLeft: 1 }
    expect(updateStreak(s, '2026-10-02').count).toBe(4)
  })

  it('하루 빠지면 보호권을 쓰고 이어진다', () => {
    const s = { count: 3, lastDay: '2026-10-01', freezeLeft: 1 }
    expect(updateStreak(s, '2026-10-03')).toEqual({
      count: 4,
      lastDay: '2026-10-03',
      freezeLeft: 0,
    })
  })

  it('보호권이 없거나 이틀 이상 빠지면 1부터', () => {
    expect(
      updateStreak({ count: 3, lastDay: '2026-10-01', freezeLeft: 0 }, '2026-10-03').count,
    ).toBe(1)
    expect(
      updateStreak({ count: 3, lastDay: '2026-10-01', freezeLeft: 1 }, '2026-10-04').count,
    ).toBe(1)
  })

  it('D4: 7일 연속이면 보호권 충전 (최대 1개)', () => {
    const s = { count: 6, lastDay: '2026-10-01', freezeLeft: 0 }
    expect(updateStreak(s, '2026-10-02').freezeLeft).toBe(1)
  })
})

describe('currentStreak', () => {
  const s = { count: 5, lastDay: '2026-10-01', freezeLeft: 0 }
  it('오늘·어제 했으면 유지, 그 이상 끊겼으면 0', () => {
    expect(currentStreak(s, '2026-10-01')).toBe(5)
    expect(currentStreak(s, '2026-10-02')).toBe(5)
    expect(currentStreak(s, '2026-10-03')).toBe(0)
    expect(currentStreak({ ...s, freezeLeft: 1 }, '2026-10-03')).toBe(5)
  })
})
