import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Container from '../components/layout/Container.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import TermCard from '../components/TermCard.jsx'
import stages from '../data/stages.json'
import { useLearning } from '../state/learningContext.js'

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'seen', label: '배운 카드' },
  { id: '1', label: 'Lv1' },
  { id: '2', label: 'Lv2' },
  { id: '3', label: 'Lv3' },
  { id: '4', label: 'Lv4' },
  { id: '5', label: 'Lv5' },
  { id: 'mastered', label: '마스터' },
  { id: 'confident', label: '확신 오답' },
  { id: 'wrong', label: '최근 오답' },
]

function matches(filter, cardState, card, lastWrong) {
  if (filter === 'all') return true
  if (!cardState) return false
  if (filter === 'seen') return true
  if (filter === 'mastered') return cardState.mastered
  if (filter === 'confident') return cardState.confidentMiss
  if (filter === 'wrong') return lastWrong.includes(card.id)
  return !cardState.mastered && cardState.level === Number(filter)
}

// 필터는 pill이 아니라 밑줄 탭 (DESIGN.md 0장 금지 목록)
function FilterTabs({ value, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label="레벨 필터" className="flex gap-5 border-b border-border">
        {FILTERS.map((f) => {
          const active = value === f.id
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(f.id)}
              className={`-mb-px h-10 shrink-0 border-b text-small font-medium whitespace-nowrap transition-colors duration-150 ${
                active ? 'border-fg text-fg' : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Collection() {
  const { state, cards } = useLearning()
  const [params, setParams] = useSearchParams()
  const [flipped, setFlipped] = useState(() => new Set())

  const filter = params.get('filter') ?? 'all'
  const stage = Number(params.get('stage')) || 0
  const lastWrong = state.lastSummary?.wrongIds ?? []

  function setParam(key, value, empty) {
    const next = new URLSearchParams(params)
    if (value === empty) next.delete(key)
    else next.set(key, String(value))
    setParams(next, { replace: true })
  }

  function toggle(id) {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visible = cards.filter(
    (c) => (!stage || c.stage === stage) && matches(filter, state.cards[c.id], c, lastWrong),
  )
  const seenCount = Object.keys(state.cards).length

  return (
    <Container className="pb-16">
      <PageHeader
        title="카드 도감"
        description={`만난 카드 ${seenCount} / ${cards.length}장. 카드를 누르면 뒷면을 볼 수 있어요. 도감에서 보는 건 레벨에 영향이 없어요.`}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <FilterTabs value={filter} onChange={(v) => setParam('filter', v, 'all')} />
        </div>
        <label className="flex items-center gap-2 text-small text-fg-muted">
          단계
          <select
            value={stage}
            onChange={(e) => setParam('stage', Number(e.target.value), 0)}
            className="h-8 rounded border border-border bg-surface px-2 text-small text-fg transition-colors duration-150 hover:border-border-strong"
          >
            <option value={0}>전체</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {String(s.id).padStart(2, '0')} {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((card) => {
            const cardState = state.cards[card.id]
            return (
              <li key={card.id}>
                <TermCard
                  card={card}
                  cardState={cardState}
                  locked={!cardState}
                  flipped={flipped.has(card.id)}
                  onFlip={() => toggle(card.id)}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="조건에 맞는 카드가 없어요"
            description={
              seenCount ? '다른 필터를 골라 보세요.' : '학습을 시작하면 카드가 여기에 모여요.'
            }
          />
        </div>
      )}
    </Container>
  )
}
