// "오늘" 계산 — 새벽 4시에 날짜가 바뀐다 (spec 4.3).
// 앱 전체에서 new Date() 대신 이 모듈을 쓴다. 테스트에서는 setNow()로 시각을 고정한다.

const DAY_START_HOUR = 4

let nowOverride = null

export function setNow(date) {
  nowOverride = date ? new Date(date) : null
}

export function now() {
  return nowOverride ? new Date(nowOverride) : new Date()
}

function toDateString(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 'YYYY-MM-DD'를 로컬 자정으로 해석한다 (UTC로 해석되는 new Date('YYYY-MM-DD') 회피).
function parseDateString(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(at = now()) {
  const d = new Date(at)
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1)
  return toDateString(d)
}

export function addDays(dateString, n) {
  const d = parseDateString(dateString)
  d.setDate(d.getDate() + n)
  return toDateString(d)
}

export function diffDays(a, b) {
  return Math.round((parseDateString(b) - parseDateString(a)) / 86_400_000)
}
