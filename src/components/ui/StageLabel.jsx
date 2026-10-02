import stages from '../../data/stages.json'
import StageDot from './StageDot.jsx'

const NAMES = Object.fromEntries(stages.map((s) => [s.id, s.name]))

// 단계는 항상 점 + 번호 + 이름을 함께 (색만으로 구분하지 않음, DESIGN.md 11장)
export default function StageLabel({ stage, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-label text-fg-muted ${className}`}
    >
      <StageDot stage={stage} />
      <span className="tabular">{String(stage).padStart(2, '0')}</span>
      <span className="font-sans">{NAMES[stage]}</span>
    </span>
  )
}
