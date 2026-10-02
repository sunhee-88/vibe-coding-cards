import { Lock } from 'lucide-react'
import Container from '../components/layout/Container.jsx'
import PageHeader from '../components/layout/PageHeader.jsx'
import Divider from '../components/ui/Divider.jsx'
import flows from '../data/flows.json'
import { useLearning } from '../state/learningContext.js'

// TODO(9단계, P1): 드래그로 순서 맞추기 (spec 5.2). 지금은 열림 조건과 진행도만 보여 준다.
export default function Flow() {
  const { state, cardsById } = useLearning()

  return (
    <Container width="narrow" className="pb-16">
      <PageHeader
        title="흐름 맞추기"
        description="요청부터 응답까지, 순서를 직접 배열해 보는 연습이에요. 관련 카드가 모두 레벨 3이 되면 열려요."
      />
      <Divider />
      <ul>
        {flows.map((flow) => {
          const ready = flow.requiredCards.filter((id) => (state.cards[id]?.level ?? 0) >= 3).length
          return (
            <li key={flow.id} className="border-b border-border py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-body font-medium">{flow.title}</p>
                <span className="inline-flex items-center gap-1 font-mono text-label text-fg-muted tabular">
                  <Lock size={12} strokeWidth={1.5} aria-hidden="true" />
                  {ready} / {flow.requiredCards.length}
                </span>
              </div>
              <p className="mt-1 text-small text-fg-subtle">
                {flow.requiredCards.map((id) => cardsById[id].term).join(' · ')}
              </p>
            </li>
          )
        })}
      </ul>
      <p className="mt-6 text-small text-fg-muted">순서 맞추기 게임은 다음 업데이트에서 열려요.</p>
    </Container>
  )
}
