// 문제 본문 — 유형별로 글자 크기만 달리해 위계를 만든다 (DESIGN.md 0장 원칙 1)
export default function QuestionPrompt({ question }) {
  const { type, label, prompt, sub, hint } = question

  return (
    <div>
      <p className="text-small text-fg-muted">{label}</p>

      {type === 'Q4' ? (
        <figure className="mt-4 rounded-md border border-border bg-surface p-5">
          <figcaption className="font-mono text-label text-fg-subtle">AI</figcaption>
          <blockquote className="mt-2 text-body-lg break-keep">{prompt}</blockquote>
        </figure>
      ) : (
        <p
          className={`mt-3 font-semibold break-keep ${
            type === 'Q2' ? 'text-display-sm' : type === 'Q1' ? 'text-h2' : 'text-h3'
          }`}
        >
          {prompt}
        </p>
      )}

      {sub && <p className="mt-3 text-body text-fg-muted">{sub}</p>}
      {hint && (
        <p
          className="mt-4 font-mono text-h3 tracking-widest text-fg-muted"
          aria-label="첫 글자 힌트"
        >
          {hint}
        </p>
      )}
    </div>
  )
}
