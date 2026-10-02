// 연속 학습일 + 보호권 (spec F11, todo.md D4)
import { diffDays } from './date.js'

export const FREEZE_RECHARGE_EVERY = 7 // D4: 7일 연속마다 보호권 1개 (최대 1개)

/** 세션을 끝낸 날 호출 — 하루에 한 번만 오른다 */
export function updateStreak(streak, today) {
  if (streak.lastDay === today) return streak
  let { count, freezeLeft } = streak
  const gap = streak.lastDay ? diffDays(streak.lastDay, today) : null

  if (gap === 1) {
    count += 1
  } else if (gap === 2 && freezeLeft > 0) {
    // 하루 빠졌지만 보호권으로 이어 간다
    freezeLeft -= 1
    count += 1
  } else {
    count = 1
  }

  if (count % FREEZE_RECHARGE_EVERY === 0) freezeLeft = 1
  return { count, lastDay: today, freezeLeft }
}

/** 화면에 보여 줄 현재 연속일 — 이미 끊겼으면 0 */
export function currentStreak(streak, today) {
  if (!streak.lastDay) return 0
  const gap = diffDays(streak.lastDay, today)
  if (gap <= 1) return streak.count
  if (gap === 2 && streak.freezeLeft > 0) return streak.count
  return 0
}
