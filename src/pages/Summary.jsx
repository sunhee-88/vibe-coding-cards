import { Link } from 'react-router-dom'
import Container from '../components/layout/Container.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StageDot from '../components/ui/StageDot.jsx'
import Divider from '../components/ui/Divider.jsx'
import { buttonClass } from '../components/ui/buttonClass.js'
import { useLearning } from '../state/learningContext.js'

function levelText(level) {
  if (level === 'M') return '마스터'
  if (level === 0) return '새 카드'
  return `Lv${level}`
}

function CardList({ title, description, rows }) {
  if (!rows.length) return null
  return (
    <section className="mt-12">
      <h2 className="text-h3 font-semibold">
        {title}{' '}
        <span className="font-mono text-body font-normal text-fg-muted tabular">{rows.length}</span>
      </h2>
      {description && <p className="mt-1 text-small text-fg-muted">{description}</p>}
      <Divider className="mt-4" />
      <ul>
        {rows.map(({ card, meta, tone }) => (
          <li
            key={card.id}
            className="flex min-h-12 items-center gap-3 border-b border-border py-3"
          >
            <StageDot stage={card.stage} />
            <span className="flex-1">
              <span className="text-body">{card.term}</span>
              <span className="ml-2 text-small text-fg-subtle">{card.chip}</span>
            </span>
            {meta && (
              <span
                className={`font-mono text-label tabular ${tone === 'amber' ? 'text-amber' : 'text-fg-muted'}`}
              >
                {meta}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Summary() {
  const { state, cardsById } = useLearning()
  const s = state.lastSummary

  if (!s) {
    return (
      <Container width="narrow" className="pt-12">
        <EmptyState
          title="아직 완료한 세션이 없어요"
          description="오늘의 학습을 마치면 여기에서 결과를 볼 수 있어요."
          action={
            <Link to="/" className={buttonClass({ variant: 'secondary' })}>
              홈으로
            </Link>
          }
        />
      </Container>
    )
  }

  const rate = s.answered ? Math.round((s.correct / s.answered) * 100) : 0
  const stats = [
    { label: '푼 문제', value: s.answered, unit: '개' },
    { label: '정답률', value: rate, unit: '%' },
    { label: '걸린 시간', value: s.minutes, unit: '분' },
    { label: '연속 학습', value: s.streak, unit: '일' },
  ]

  return (
    <Container width="narrow" className="pb-16">
      <section className="pt-12 pb-10">
        <p className="font-mono text-label text-fg-muted">세션 완료</p>
        <h1 className="mt-3 text-display-sm font-semibold md:text-display">오늘 학습 끝.</h1>
        <p className="mt-3 text-body text-fg-muted">
          내일 복습 <span className="font-mono text-fg tabular">{s.tomorrowCount}</span>장이
          기다려요. 잊어버릴 즈음 다시 나오는 게 오래 기억하는 비결이에요.
        </p>
      </section>

      <dl className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
        {stats.map((st, i) => (
          <div
            key={st.label}
            className={`flex flex-col gap-2 border-border py-5 ${i % 2 ? 'border-l pl-4' : 'pr-4'} ${
              i < 2 ? 'border-b sm:border-b-0' : ''
            } ${i > 0 ? 'sm:border-l sm:pl-4' : ''}`}
          >
            <dt className="font-mono text-label text-fg-muted">{st.label}</dt>
            <dd className="font-mono text-h2 font-medium tabular">
              {st.value}
              <span className="ml-1 text-small text-fg-muted">{st.unit}</span>
            </dd>
          </div>
        ))}
      </dl>

      <CardList
        title="확신했는데 틀린 카드"
        description="다음 세션 복습 맨 앞에 다시 나와요."
        rows={s.confidentMissIds.map((id) => ({
          card: cardsById[id],
          meta: '우선 복습',
          tone: 'amber',
        }))}
      />
      <CardList
        title="레벨이 오른 카드"
        rows={s.levelUps.map((u) => ({
          card: cardsById[u.cardId],
          meta: `${levelText(u.from)} → ${levelText(u.to)}`,
        }))}
      />
      <CardList
        title="새로 배운 카드"
        rows={s.introducedIds.map((id) => ({ card: cardsById[id], meta: '내일 복습' }))}
      />

      <div className="mt-12 flex flex-col gap-2 sm:flex-row">
        <Link to="/" className={buttonClass({ size: 'lg' })}>
          홈으로
        </Link>
        {s.wrongIds.length > 0 && (
          <Link
            to="/collection?filter=wrong"
            className={buttonClass({ variant: 'secondary', size: 'lg' })}
          >
            틀린 카드 다시 보기
          </Link>
        )}
      </div>
    </Container>
  )
}
