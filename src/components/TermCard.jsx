import { Lock } from 'lucide-react'
import { CARD_ICONS } from './cardIcons.js'
import LevelDots from './LevelDots.jsx'
import StageLabel from './ui/StageLabel.jsx'
import Divider from './ui/Divider.jsx'

function CardHeader({ card, cardState }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <StageLabel stage={card.stage} />
      {cardState && <LevelDots level={cardState.level} mastered={cardState.mastered} />}
    </div>
  )
}

function Front({ card, cardState, locked }) {
  const Icon = CARD_ICONS[card.icon]
  return (
    <div className="flex h-full flex-col">
      <CardHeader card={card} cardState={locked ? null : cardState} />
      <div className="mt-8 flex items-start gap-3">
        {locked ? (
          <Lock
            size={20}
            strokeWidth={1.5}
            className="mt-1.5 shrink-0 text-fg-subtle"
            aria-hidden="true"
          />
        ) : (
          Icon && (
            <Icon
              size={20}
              strokeWidth={1.5}
              className="mt-1.5 shrink-0 text-fg-muted"
              aria-hidden="true"
            />
          )
        )}
        <div className="min-w-0">
          <h3 className={`text-h2 font-semibold break-keep ${locked ? 'text-fg-subtle' : ''}`}>
            {card.term}
          </h3>
          {card.termFull && <p className="mt-1 text-caption text-fg-subtle">{card.termFull}</p>}
        </div>
      </div>
      <p className="mt-auto pt-8 font-mono text-label text-fg-muted">
        {locked ? '아직 배우지 않은 카드예요' : card.chip}
      </p>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex gap-3 py-2">
      <dt className="w-14 shrink-0 pt-0.5 font-mono text-label text-fg-subtle">{label}</dt>
      <dd className="text-small text-fg-muted">{children}</dd>
    </div>
  )
}

function Back({ card, cardState }) {
  return (
    <div>
      <CardHeader card={card} cardState={cardState} />
      <h3 className="mt-6 text-h3 font-semibold">{card.term}</h3>
      <p className="mt-2 text-body-lg">{card.definition}</p>
      <Divider className="mt-6" />
      <dl className="mt-2">
        <Row label="비유">{card.analogy}</Row>
        <Row label="예시">{card.example}</Row>
        <Row label="AI에게">{card.vibeTip}</Row>
      </dl>
    </div>
  )
}

/**
 * 용어 카드 (DESIGN.md 8장) — 1px border, 모서리 8, 그림자 없음.
 * onFlip을 주면 카드 전체가 뒤집기 버튼이 된다. locked면 용어만 보이고 뒤집히지 않는다.
 */
export default function TermCard({ card, cardState, flipped = false, onFlip, locked = false }) {
  const interactive = Boolean(onFlip) && !locked
  const faceClass = `col-start-1 row-start-1 rounded-md border border-border bg-surface p-6 backface-hidden transition-colors duration-150 ${
    interactive ? 'group-hover:border-border-strong' : ''
  }`

  const body = (
    <div
      className={`grid transform-3d transition-transform duration-300 ease-standard ${
        flipped ? 'rotate-y-180' : ''
      }`}
    >
      <div className={faceClass} aria-hidden={flipped}>
        <Front card={card} cardState={cardState} locked={locked} />
      </div>
      <div className={`${faceClass} rotate-y-180`} aria-hidden={!flipped}>
        {!locked && <Back card={card} cardState={cardState} />}
      </div>
    </div>
  )

  if (!interactive) return <div className="perspective-distant">{body}</div>

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={flipped ? `${card.term} 앞면 보기` : `${card.term} 뒷면 보기`}
      className="group block w-full rounded-md text-left perspective-distant"
    >
      {body}
    </button>
  )
}
