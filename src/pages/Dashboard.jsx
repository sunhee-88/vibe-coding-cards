import Container from '../components/layout/Container.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import Divider from '../components/ui/Divider.jsx'
import Button from '../components/ui/Button.jsx'
import stages from '../data/stages.json'
import { useLearning } from '../state/learningContext.js'
import { DAILY_NEW_OPTIONS } from '../lib/storage.js'
import { confidentMissRate, levelDistribution, retentionRate } from '../lib/stats.js'

const LEVELS = [
  { key: 1, label: 'Lv1' },
  { key: 2, label: 'Lv2' },
  { key: 3, label: 'Lv3' },
  { key: 4, label: 'Lv4' },
  { key: 5, label: 'Lv5' },
  { key: 'M', label: '마스터' },
]

function Section({ title, description, children }) {
  return (
    <section className="py-10">
      <h2 className="text-h3 font-semibold">{title}</h2>
      {description && <p className="mt-1 text-small text-fg-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function Dashboard() {
  const { state, cards, update, reset } = useLearning()
  const dist = levelDistribution(state)
  const retention = retentionRate(state)
  const missRate = confidentMissRate(state)
  const seen = Object.keys(state.cards).length

  const metrics = [
    { label: '만난 카드', value: seen, unit: `/ ${cards.length}` },
    { label: '7일 유지율', value: retention ?? '—', unit: retention == null ? '' : '%' },
    { label: '확신 오답률', value: missRate ?? '—', unit: missRate == null ? '' : '%' },
    { label: '누적 학습', value: state.stats.totalMinutes, unit: '분' },
  ]

  function handleReset() {
    if (window.confirm('모든 학습 기록을 지울까요? 되돌릴 수 없어요.')) reset()
  }

  return (
    <Container width="narrow" className="pb-16">
      <PageHeader title="학습 기록" description="내가 확실히 아는 것과 헷갈리는 것을 확인해요." />

      <dl className="grid grid-cols-2 border-y border-border">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex flex-col gap-2 border-border py-5 ${i % 2 ? 'border-l pl-4' : 'pr-4'} ${
              i < 2 ? 'border-b' : ''
            }`}
          >
            <dt className="font-mono text-label text-fg-muted">{m.label}</dt>
            <dd className="font-mono text-h2 font-medium tabular">
              {m.value}
              {m.unit && <span className="ml-1 text-small text-fg-muted">{m.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <Section
        title="레벨 분포"
        description="레벨이 오를수록 복습 간격이 1 → 2 → 4 → 7 → 14일로 늘어나요."
      >
        <ul className="space-y-3">
          {LEVELS.map(({ key, label }) => {
            const n = dist[key]
            const pct = cards.length ? (n / cards.length) * 100 : 0
            return (
              <li key={key} className="flex items-center gap-4">
                <span className="w-12 font-mono text-label text-fg-muted">{label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-sm bg-bg-active">
                  <span
                    className="block h-full rounded-sm bg-fg transition-[width] duration-200 ease-standard"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-8 text-right font-mono text-small tabular">{n}</span>
              </li>
            )
          })}
        </ul>
      </Section>

      <Divider />

      <Section title="하루 새 카드 수" description="적게 배울수록 오래 남아요. 기본은 5장이에요.">
        <div
          role="radiogroup"
          aria-label="하루 새 카드 수"
          className="grid h-10 w-full grid-cols-3 gap-0.5 rounded border border-border bg-bg p-0.5 sm:w-72"
        >
          {DAILY_NEW_OPTIONS.map((n) => {
            const selected = state.settings.dailyNew === n
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => update((s) => ({ ...s, settings: { ...s.settings, dailyNew: n } }))}
                className={`rounded-sm font-mono text-small font-medium tabular transition-colors duration-150 ${
                  selected
                    ? 'border border-border-strong bg-surface text-fg'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                {n}장
              </button>
            )
          })}
        </div>
      </Section>

      <Divider />

      <Section
        title="먼저 배울 단계"
        description="고른 단계의 새 카드가 먼저 나와요. 그 단계를 다 배우면 원래 순서로 이어져요."
      >
        <select
          aria-label="먼저 배울 단계"
          value={state.settings.focusStage ?? 0}
          onChange={(e) =>
            update((s) => ({
              ...s,
              settings: { ...s.settings, focusStage: Number(e.target.value) || null },
            }))
          }
          className="h-10 w-full rounded border border-border bg-surface px-3 text-small text-fg transition-colors duration-150 hover:border-border-strong sm:w-72"
        >
          <option value={0}>순서대로 (01부터)</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {String(s.id).padStart(2, '0')} {s.name}
            </option>
          ))}
        </select>
      </Section>

      <Divider />

      <Section
        title="기록 초기화"
        description="학습 기록은 이 브라우저에만 저장돼요. 기기를 바꾸면 기록이 이어지지 않아요."
      >
        <Button variant="secondary" onClick={handleReset}>
          모든 기록 지우기
        </Button>
      </Section>
    </Container>
  )
}
