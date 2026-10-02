import { Star } from 'lucide-react'

// 레벨 점 5개 — 채움 fg / 빈 점 border-strong, 마스터는 Star (DESIGN.md 17장)
export default function LevelDots({ level = 0, mastered = false }) {
  if (mastered) {
    return (
      <span
        className="inline-flex items-center gap-1 font-mono text-label text-fg"
        aria-label="마스터"
      >
        <Star size={12} strokeWidth={1.5} className="fill-current" aria-hidden="true" />
        마스터
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1" aria-label={`레벨 ${level} / 5`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={`size-1.5 rounded-full transition-colors duration-200 ${
            n <= level ? 'bg-fg' : 'bg-border-strong'
          }`}
        />
      ))}
    </span>
  )
}
