import { CONFIDENCE } from '../lib/leitner.js'

const OPTIONS = [
  { value: CONFIDENCE.SURE, label: '확신' },
  { value: CONFIDENCE.UNSURE, label: '애매' },
  { value: CONFIDENCE.UNKNOWN, label: '모름' },
]

// 확신도 버튼 3개 — 텍스트만, 이모지 없음 (DESIGN.md 17장)
// 답을 고른 뒤에 활성화되고, 누르는 순간 채점된다 (선택 상태를 따로 두지 않음).
export default function ConfidenceControl({ onChange, disabled = false }) {
  return (
    <div>
      <p id="confidence-label" className="font-mono text-label text-fg-muted">
        {disabled
          ? '답을 고르면 확신도를 선택할 수 있어요'
          : '이 답, 얼마나 확실한가요? 누르면 채점돼요'}
      </p>
      <div
        role="group"
        aria-labelledby="confidence-label"
        className="mt-2 grid h-12 w-full grid-cols-3 gap-2 sm:w-96"
      >
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className="rounded border border-border bg-surface text-small font-medium text-fg transition-[border-color,background-color,opacity] duration-150 enabled:hover:border-border-strong enabled:hover:bg-bg-hover enabled:active:bg-bg-active disabled:cursor-not-allowed disabled:opacity-40"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
