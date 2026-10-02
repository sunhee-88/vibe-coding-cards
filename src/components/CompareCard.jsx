function Side({ tone, label, title, body, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      <p className="flex items-center gap-2 font-mono text-label text-fg-muted">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${tone === 'correct' ? 'bg-green' : 'bg-red'}`}
        />
        {label}
      </p>
      <p className="mt-3 text-h3 font-semibold break-keep">{title}</p>
      {body && <p className="mt-2 text-small text-fg-muted">{body}</p>}
    </div>
  )
}

/**
 * 오답 비교 카드 (DESIGN.md 8장) — 카드 두 개가 아니라 한 카드를 선으로 나눈다.
 * chosen/correct: { title, body }
 */
export default function CompareCard({ chosen, correct, contrast }) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="grid sm:grid-cols-2">
        <Side tone="wrong" label="내가 고른 답" {...chosen} />
        <Side
          tone="correct"
          label="정답"
          {...correct}
          className="border-t border-border sm:border-t-0 sm:border-l"
        />
      </div>
      {contrast && (
        <p className="border-t border-border px-6 py-4 text-small text-fg-muted">{contrast}</p>
      )}
    </div>
  )
}
