import { Check, X } from 'lucide-react'

function stateOf(option, { revealed, chosenId, selectedId }) {
  if (!revealed) return option.id === selectedId ? 'selected' : 'idle'
  if (option.correct) return 'correct'
  if (option.id === chosenId) return 'wrong'
  return 'muted'
}

const STYLES = {
  idle: 'border-border bg-surface enabled:hover:border-border-strong enabled:hover:bg-bg-hover',
  selected: 'border-fg bg-surface',
  correct: 'border-green bg-surface',
  wrong: 'border-red bg-surface',
  muted: 'border-border bg-surface text-fg-subtle',
}

/**
 * 4지선다 보기 (DESIGN.md 7장) — 높이 ≥ 56px, 번호 1~4는 키보드 단축키와 같다.
 * 채점 전에는 고른 답(selectedId)을 fg 테두리로 표시하고 다시 바꿀 수 있다.
 * revealed면 정답/내가 고른 답을 색 + 아이콘 + 글자로 표시한다.
 */
export default function Choices({ options, onSelect, disabled, revealed, chosenId, selectedId }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {options.map((option, i) => {
        const state = stateOf(option, { revealed, chosenId, selectedId })
        return (
          <li key={option.id}>
            <button
              type="button"
              aria-pressed={revealed ? undefined : state === 'selected'}
              disabled={disabled || revealed}
              onClick={() => onSelect(option)}
              className={`flex min-h-14 w-full items-start gap-3 rounded border px-4 py-3 text-left transition-[border-color,background-color,opacity] duration-150 ${
                STYLES[state]
              } ${disabled && !revealed ? 'cursor-not-allowed opacity-40' : ''} ${
                revealed ? 'cursor-default' : ''
              }`}
            >
              <span className="mt-0.5 w-4 shrink-0 font-mono text-label text-fg-subtle tabular">
                {i + 1}
              </span>
              <span className="flex-1 text-body break-keep">{option.text}</span>
              {state === 'correct' && (
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-label font-medium text-green">
                  <Check size={16} strokeWidth={2} aria-hidden="true" />
                  정답
                </span>
              )}
              {state === 'wrong' && (
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-label font-medium text-red">
                  <X size={16} strokeWidth={2} aria-hidden="true" />내 답
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
