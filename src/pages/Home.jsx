import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import Container from '../components/layout/Container.jsx'
import Divider from '../components/ui/Divider.jsx'
import StageDot from '../components/ui/StageDot.jsx'
import Button from '../components/ui/Button.jsx'
import { buttonClass } from '../components/ui/buttonClass.js'
import stages from '../data/stages.json'
import { useLearning } from '../state/learningContext.js'
import { activeSession, isSessionFinished, planToday, startSession } from '../lib/session.js'
import { countDueTomorrow, countMastered, retentionRate, seenCountByStage } from '../lib/stats.js'
import { currentStreak } from '../lib/streak.js'

// 등급 칭호 — 마스터 카드 수 기준 (PRD 5.3)
function rankTitle(mastered, total) {
  if (mastered >= total) return '시스템 구조 마스터'
  if (mastered >= 30) return '개발자와 대화 가능'
  if (mastered >= 10) return 'AI 말귀가 트이는 중'
  return null
}

// 통계는 카드가 아니라 구분선으로 나눈 칸 (DESIGN.md 16장)
// 모바일 2×2: 오른쪽 열에 세로선, 첫 줄 아래 가로선 / lg 1×4: 첫 칸 뒤로 세로선
function statCellClass(i) {
  return [
    'border-border py-6',
    i % 2 ? 'border-l pl-4' : 'pr-4',
    i < 2 ? 'border-b lg:border-b-0' : '',
    i > 0 ? 'lg:border-l lg:pl-6' : '',
  ].join(' ')
}

function Stat({ index, label, value, unit }) {
  return (
    <div className={`flex flex-col gap-2 ${statCellClass(index)}`}>
      <dt className="font-mono text-label text-fg-muted">{label}</dt>
      <dd className="font-mono text-stat font-medium tabular">
        {value}
        {unit && <span className="ml-1 text-body text-fg-muted">{unit}</span>}
      </dd>
    </div>
  )
}

function Count({ children }) {
  return <span className="font-mono text-fg tabular">{children}</span>
}

function TodayPanel() {
  const { state, today, cards, update } = useLearning()
  const navigate = useNavigate()
  const session = activeSession(state, today)
  const inProgress = session && !isSessionFinished(session)
  const plan = planToday(state, cards, today)
  const todo = plan.reviews.length + plan.fresh.length
  const seenAll = Object.keys(state.cards).length >= cards.length

  function start() {
    if (!inProgress) update((s) => startSession(s, cards, today))
    navigate('/session')
  }

  if (inProgress) {
    return (
      <>
        <h1 className="mt-3 text-display-sm font-semibold md:text-display">하던 학습이 있어요.</h1>
        <p className="mt-3 text-body text-fg-muted">
          남은 문제 <Count>{session.items.length - session.index}</Count>개
        </p>
        <div className="mt-6 sm:max-w-60">
          <Button size="lg" block onClick={start}>
            이어하기
          </Button>
        </div>
      </>
    )
  }

  if (!todo) {
    return (
      <>
        <h1 className="mt-3 text-display-sm font-semibold md:text-display">
          {state.streak.lastDay === today ? '오늘 학습 끝.' : '오늘은 쉬어도 돼요.'}
        </h1>
        <p className="mt-3 text-body text-fg-muted">
          {seenAll ? '모든 카드를 만났어요. ' : ''}내일 복습{' '}
          <Count>{countDueTomorrow(state, today)}</Count>장이 기다려요.
        </p>
        <div className="mt-6">
          <Link to="/collection" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
            도감에서 다시 보기
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="mt-3 text-display-sm font-semibold md:text-display">
        {Object.keys(state.cards).length ? '오늘도 5분이면 충분해요.' : '첫 카드부터 시작해요.'}
      </h1>
      <p className="mt-3 text-body text-fg-muted">
        복습 <Count>{plan.reviews.length}</Count>장 · 새 카드 <Count>{plan.fresh.length}</Count>장
        {plan.dueTotal > plan.reviews.length && (
          <> · 나머지 {plan.dueTotal - plan.reviews.length}장은 내일로</>
        )}
      </p>
      <div className="mt-6 sm:max-w-60">
        <Button size="lg" block onClick={start}>
          학습 시작
        </Button>
      </div>
    </>
  )
}

export default function Home() {
  const { state, storageOk, today, cards } = useLearning()
  const mastered = countMastered(state)
  const retention = retentionRate(state)
  const streak = currentStreak(state.streak, today)
  const seen = seenCountByStage(state, cards)
  const plan = planToday(state, cards, today)
  const rank = rankTitle(mastered, cards.length)

  return (
    <Container>
      {!storageOk && (
        <p className="mt-6 flex items-center gap-2 rounded border border-border bg-surface px-4 py-3 text-small text-amber">
          <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />이 브라우저에서는 기록이
          저장되지 않아요. 창을 닫으면 진행 상황이 사라져요.
        </p>
      )}

      <section className="pt-12 pb-12 md:pt-16">
        <p className="font-mono text-label text-fg-muted">{rank ?? '오늘의 학습'}</p>
        <TodayPanel />
      </section>

      <dl className="grid grid-cols-2 border-y border-border lg:grid-cols-4">
        <Stat index={0} label="마스터" value={mastered} unit={`/ ${cards.length}`} />
        <Stat index={1} label="오늘 복습" value={plan.reviews.length} unit="장" />
        <Stat
          index={2}
          label="7일 유지율"
          value={retention ?? '—'}
          unit={retention == null ? '' : '%'}
        />
        <Stat index={3} label="연속 학습" value={streak} unit="일" />
      </dl>

      <section className="pt-12 pb-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3 font-semibold">학습 단계</h2>
          <Link
            to="/collection"
            className="rounded-sm text-small font-medium text-fg-muted transition-colors duration-150 hover:text-fg"
          >
            도감 보기
          </Link>
        </div>
        <p className="mt-2 text-small text-fg-muted">
          새 카드는 이 순서대로 나와요. 복습은 단계를 섞어서 나와요.
        </p>
        <Divider className="mt-6" />
        <ol>
          {stages.map((stage) => (
            <li key={stage.id} className="border-b border-border">
              <Link
                to={`/collection?stage=${stage.id}`}
                className="-mx-2 flex h-12 items-center gap-3 rounded-sm px-2 transition-colors duration-150 hover:bg-bg-hover"
              >
                <StageDot stage={stage.id} />
                <span className="w-6 font-mono text-label text-fg-subtle tabular">
                  {String(stage.id).padStart(2, '0')}
                </span>
                <span className="flex-1 text-body">{stage.name}</span>
                <span className="font-mono text-small text-fg-muted tabular">
                  {seen[stage.id] ?? 0} / {stage.cardCount}
                </span>
                <ChevronRight
                  size={16}
                  strokeWidth={1.5}
                  className="text-fg-subtle"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </Container>
  )
}
