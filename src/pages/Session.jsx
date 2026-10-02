import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import Container from '../components/layout/Container.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Button from '../components/ui/Button.jsx'
import { buttonClass } from '../components/ui/buttonClass.js'
import StageLabel from '../components/ui/StageLabel.jsx'
import TermCard from '../components/TermCard.jsx'
import LevelDots from '../components/LevelDots.jsx'
import ConfidenceControl from '../components/ConfidenceControl.jsx'
import Choices from '../components/Choices.jsx'
import CompareCard from '../components/CompareCard.jsx'
import QuestionPrompt from '../components/QuestionPrompt.jsx'
import { useLearning } from '../state/learningContext.js'
import { createRng } from '../lib/random.js'
import { buildQuestion, checkTypedAnswer, pickQuestionType } from '../lib/questions.js'
import {
  activeSession,
  answerCurrent,
  completeIntro,
  finishSession,
  isSessionFinished,
  planToday,
  startSession,
} from '../lib/session.js'

const PHASE_LABEL = { review: '복습', new: '새 카드', retry: '재도전' }

function levelText(level) {
  if (level === 'M') return '마스터'
  if (level === 0) return '새 카드'
  return `레벨 ${level}`
}

// ─── 레이아웃 ──────────────────────────────────────────────────────────────

function SessionHeader({ current, total }) {
  const progress = total ? Math.min(100, (current / total) * 100) : 0
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg">
      <Container width="narrow" className="grid h-14 grid-cols-3 items-center">
        <Link
          to="/"
          aria-label="학습 닫기"
          className={`${buttonClass({ variant: 'ghost', size: 'sm' })} -ml-3 w-fit`}
        >
          <X size={16} strokeWidth={1.5} aria-hidden="true" />
          닫기
        </Link>
        <p className="text-center font-mono text-small text-fg-muted tabular">
          {total ? `${current} / ${total}` : ''}
        </p>
      </Container>
      <div className="h-0.5 bg-border">
        <div
          className="h-full bg-fg transition-[width] duration-200 ease-standard"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  )
}

// 모바일 한 손 조작을 위해 주 행동 버튼은 화면 아래에 고정
function ActionBar({ children }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg py-3">
      <Container width="narrow">{children}</Container>
    </div>
  )
}

function Shell({ current, total, children, action }) {
  return (
    <div className="min-h-dvh bg-bg">
      <SessionHeader current={current} total={total} />
      <Container width="narrow" className="pt-8 pb-32">
        {children}
      </Container>
      {action && <ActionBar>{action}</ActionBar>}
    </div>
  )
}

// ─── 결과 표시 ────────────────────────────────────────────────────────────

function ResultLine({ answer }) {
  const { correct, result } = answer
  let detail = null
  if (result.graded) detail = `${levelText(result.from)} → ${levelText(result.to)}`
  else if (result.phase === 'new') detail = '한 번 더 떠올리기 · 레벨은 내일 복습에서 올라가요'
  else if (result.phase === 'retry') detail = '재도전 · 연습이라 레벨은 그대로예요'

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <p
        className={`inline-flex items-center gap-2 text-h3 font-semibold ${
          correct ? 'text-green' : 'text-red'
        }`}
      >
        {correct ? (
          <Check size={20} strokeWidth={2} aria-hidden="true" />
        ) : (
          <X size={20} strokeWidth={2} aria-hidden="true" />
        )}
        {correct ? '정답이에요' : '아쉬워요'}
      </p>
      {detail && <p className="font-mono text-label text-fg-muted">{detail}</p>}
    </div>
  )
}

function Feedback({ answer, card, cardsById }) {
  const { correct, confidence, question, chosenId, typed } = answer

  if (correct) {
    return (
      <div className="mt-8 space-y-4">
        <ResultLine answer={answer} />
        <TermCard card={card} cardState={null} flipped />
      </div>
    )
  }

  const chosenOption = question.options?.find((o) => o.id === chosenId)
  const chosenCard = chosenOption?.cardId ? cardsById[chosenOption.cardId] : null
  const chosen =
    question.mode === 'input'
      ? { title: typed?.trim() || '(입력 없음)', body: null }
      : chosenCard
        ? { title: chosenCard.term, body: chosenCard.definition }
        : { title: chosenOption?.text, body: null }
  const correctSide =
    question.type === 'Q4'
      ? { title: card.situation.answer, body: `${card.term} — ${card.definition}` }
      : { title: card.term, body: card.definition }
  const contrast = chosenCard && card.confusableWith.includes(chosenCard.id) ? card.contrast : null

  return (
    <div className="mt-8 space-y-4">
      <ResultLine answer={answer} />
      {confidence === 'sure' && (
        <p className="flex items-center gap-2 text-small text-amber">
          <span aria-hidden="true" className="size-2 rounded-full bg-amber" />
          확신했던 문제예요. 이번에 확실히 고쳐요.
        </p>
      )}
      <CompareCard chosen={chosen} correct={correctSide} contrast={contrast} />
      <p className="text-small text-fg-muted">
        <span className="font-mono text-label text-fg-subtle">비유</span>
        <span className="ml-3">{card.analogy}</span>
      </p>
    </div>
  )
}

// ─── 페이지 ───────────────────────────────────────────────────────────────

export default function Session() {
  const { state, today, cards, cardsById, update } = useLearning()
  const navigate = useNavigate()
  const session = activeSession(state, today)

  // 방금 답한 문제 (세션은 이미 다음 항목으로 넘어갔고, 화면은 이 결과를 보여 준다)
  const [answer, setAnswer] = useState(null)
  // 답을 먼저 고르고(바꿀 수 있음), 확신도를 누르는 순간 채점한다
  const [pendingId, setPendingId] = useState(null)
  const [typed, setTyped] = useState('')
  const [introFlipped, setIntroFlipped] = useState(false)

  const item = session && !isSessionFinished(session) ? session.items[session.index] : null

  const question = useMemo(() => {
    if (!item || item.kind !== 'question') return null
    const card = cardsById[item.cardId]
    const rng = createRng(`${session.startedAt}:${session.index}:${item.cardId}`)
    // 새 카드 단계는 항상 Q1, 복습·재도전은 현재 레벨에 맞는 문제
    const type = item.phase === 'new' ? 'Q1' : pickQuestionType(card, state.cards[item.cardId], rng)
    return buildQuestion(card, cards, type, rng)
    // 문제는 항목이 바뀔 때만 새로 만든다 (답한 뒤 카드 레벨이 바뀌어도 그대로)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.startedAt, session?.index, item?.cardId])

  const shown = answer ?? (item ? { item, question } : null)

  // 핸들러 메모이제이션은 React Compiler에 맡긴다 (수동 useCallback 없음)
  // 확신도 선택 = 제출. 정답을 보기 전에 매겨야 '확신 오답' 교정 효과가 산다 (PRD L6)
  function submit(confidence) {
    if (!item || !question) return
    let correct
    let chosenId = null
    if (question.mode === 'choice') {
      const option = question.options.find((o) => o.id === pendingId)
      if (!option) return
      correct = option.correct
      chosenId = option.id
    } else {
      if (!typed.trim()) return
      correct = checkTypedAnswer(typed, cardsById[item.cardId])
    }
    let result
    update((s) => {
      const out = answerCurrent(s, { correct, confidence, questionType: question.type }, today)
      result = out.result
      return out.state
    })
    setAnswer({ item, question, correct, confidence, chosenId, typed, result })
  }

  function next() {
    setAnswer(null)
    setPendingId(null)
    setTyped('')
    setIntroFlipped(false)
    const s = activeSession(state, today)
    if (s && isSessionFinished(s)) {
      update((prev) => finishSession(prev, today))
      navigate('/summary')
    }
  }

  function finishIntro() {
    update((s) => completeIntro(s, today))
    setIntroFlipped(false)
  }

  // 키보드: 1~4 보기 선택, Enter 다음/뒤집기
  // 입력창에선 무시, 버튼·링크 위의 Enter는 브라우저 클릭에 맡긴다 (두 번 처리되지 않게)
  const onKey = useEffectEvent((e) => {
    const tag = e.target.tagName
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return
    const isEnter = e.key === 'Enter'
    if (isEnter && (tag === 'BUTTON' || tag === 'A')) return

    if (answer) {
      if (isEnter) {
        e.preventDefault()
        next()
      }
      return
    }
    if (item?.kind === 'intro' && isEnter) {
      e.preventDefault()
      if (introFlipped) finishIntro()
      else setIntroFlipped(true)
      return
    }
    if (question?.mode === 'choice' && /^[1-4]$/.test(e.key)) {
      const option = question.options[Number(e.key) - 1]
      if (option) setPendingId(option.id)
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 오늘 세션이 없으면: 시작 화면
  if (!session) {
    const plan = planToday(state, cards, today)
    const count = plan.reviews.length + plan.fresh.length
    return (
      <Shell current={0} total={0}>
        {count ? (
          <div className="pt-4">
            <p className="font-mono text-label text-fg-muted">오늘의 학습</p>
            <h1 className="mt-3 text-h1-sm font-semibold md:text-h1">준비됐어요.</h1>
            <p className="mt-3 text-body text-fg-muted">
              복습 <span className="font-mono text-fg tabular">{plan.reviews.length}</span>장 · 새
              카드 <span className="font-mono text-fg tabular">{plan.fresh.length}</span>장
            </p>
            <div className="mt-6 sm:max-w-60">
              <Button size="lg" block onClick={() => update((s) => startSession(s, cards, today))}>
                학습 시작
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="오늘 학습은 끝났어요"
            description="잊어버릴 즈음 다시 나올 거예요. 내일 또 만나요."
            action={
              <Link to="/" className={buttonClass({ variant: 'secondary' })}>
                홈으로
              </Link>
            }
          />
        )}
      </Shell>
    )
  }

  const total = session.items.length
  const current = answer ? session.index : session.index + 1

  // 새로고침 등으로 결과를 못 본 채 끝난 세션
  if (!shown) {
    return (
      <Shell current={total} total={total}>
        <EmptyState
          title="세션을 모두 마쳤어요"
          description="오늘 배운 카드와 내일 복습할 카드를 확인해요."
          action={
            <Button onClick={next} variant="primary">
              결과 보기
            </Button>
          }
        />
      </Shell>
    )
  }

  const card = cardsById[shown.item.cardId]
  const cardState = state.cards[card.id]

  // 새 카드 소개
  if (shown.item.kind === 'intro') {
    return (
      <Shell
        current={current}
        total={total}
        action={
          introFlipped ? (
            <Button size="lg" block onClick={finishIntro}>
              기억했어요
            </Button>
          ) : (
            <Button size="lg" block variant="secondary" onClick={() => setIntroFlipped(true)}>
              뒷면 보기
            </Button>
          )
        }
      >
        <p className="font-mono text-label text-fg-muted">새 카드 · 처음 만나는 용어예요</p>
        <div className="mt-4">
          <TermCard card={card} flipped={introFlipped} onFlip={() => setIntroFlipped((f) => !f)} />
        </div>
        <p className="mt-4 text-small text-fg-muted">
          뒷면의 비유를 떠올리며 읽어 보세요. 곧 바로 문제로 나와요.
        </p>
      </Shell>
    )
  }

  // 문제 (+ 답한 뒤 결과)
  const q = shown.question
  const revealed = Boolean(answer)
  const levelState = revealed ? null : cardState

  return (
    <Shell
      current={current}
      total={total}
      action={
        revealed ? (
          <Button size="lg" block onClick={next}>
            {isSessionFinished(session) ? '결과 보기' : '다음'}
          </Button>
        ) : null
      }
    >
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-3">
          <span className="font-mono text-label text-fg">{PHASE_LABEL[shown.item.phase]}</span>
          <StageLabel stage={card.stage} />
        </p>
        {levelState && <LevelDots level={levelState.level} mastered={levelState.mastered} />}
      </div>

      <div className="mt-6">
        <QuestionPrompt question={q} />
      </div>

      <div className="mt-8">
        {q.mode === 'choice' ? (
          <Choices
            options={q.options}
            selectedId={pendingId}
            revealed={revealed}
            chosenId={answer?.chosenId}
            onSelect={(o) => setPendingId(o.id)}
          />
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="typed-answer" className="font-mono text-label text-fg-muted">
              용어 입력
            </label>
            <input
              id="typed-answer"
              value={revealed ? answer.typed : typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={revealed}
              autoComplete="off"
              placeholder="예: 로드 밸런서"
              className="mt-2 h-12 w-full rounded border border-border bg-surface px-4 text-body transition-colors duration-150 placeholder:text-fg-subtle hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-40"
            />
          </form>
        )}
      </div>

      {!revealed && (
        <div className="mt-8">
          <ConfidenceControl
            disabled={q.mode === 'choice' ? !pendingId : !typed.trim()}
            onChange={submit}
          />
        </div>
      )}

      {revealed && <Feedback answer={answer} card={card} cardsById={cardsById} />}
    </Shell>
  )
}
