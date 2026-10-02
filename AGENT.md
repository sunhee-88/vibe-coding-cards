# AGENT.md — 작업 규칙

> 이 프로젝트에서 코드를 쓰는 사람과 AI(Claude 등) 모두가 따르는 규칙이다.

## 1. 작업 전에 읽는 순서
1. `todo.md` — 지금 몇 단계인지, 다음 할 일이 무엇인지
2. `spec.md` — 해당 기능의 규칙·데이터 구조
3. `DESIGN.md` — **UI를 만들거나 고치는 작업이면 반드시 먼저**
4. `PRD.md` — 우선순위(P0/P1)나 "왜"가 헷갈릴 때

문서끼리 충돌하면: 디자인은 `DESIGN.md` > `spec.md` 7장, 기능은 `spec.md` > `PRD.md`.

## 2. 단계별 진행
- `todo.md`의 **단계 순서대로** 진행한다. 이전 단계의 "완료 확인"을 통과하기 전에 다음 단계로 넘어가지 않는다.
- 한 번에 한 단계(또는 그 안의 한 묶음)만 작업한다. 요청받지 않은 단계의 기능을 미리 만들지 않는다.
- 작업을 마치면 `todo.md`의 해당 체크박스를 `[x]`로 바꾸고, 진행 현황 표의 상태를 갱신한다 (⬜ → 🟨 진행 중 → ✅ 완료).
- `todo.md` 하단 **결정 필요 사항(D1~D6)**에 걸리는 작업은 임의로 정하지 말고 먼저 묻는다.

## 3. 폴더와 책임

| 위치 | 넣는 것 | 넣지 않는 것 |
|---|---|---|
| `src/lib/` | 학습 엔진·세션·문제 생성·날짜·저장. **순수 함수** 위주 | React, DOM 접근 (storage.js만 localStorage 접근 허용) |
| `src/state/` | 학습 상태 Provider·`useLearning()`. 변경은 `update(fn)`에 `lib/`의 순수 함수를 넘겨서 | 계산 로직 → `lib/`로 |
| `src/data/` | `cards.json`, `flows.json`, `stages.json` | 코드 |
| `src/components/ui/` | 범용 부품 (Button, SegmentedControl, Divider…) | 학습 도메인 로직 |
| `src/components/` | 도메인 부품 (TermCard, Choices, CompareCard, LevelDots…) | 데이터 가공 로직 → `lib/`로 |
| `src/components/layout/` | 헤더, 탭바, 컨테이너 | |
| `src/pages/` | 라우트 단위 화면. `lib/` 호출 + 컴포넌트 조합 | 복잡한 계산 |
| `src/styles/` | 디자인 토큰(`index.css`) | 컴포넌트별 CSS 파일 |
| `tests/` | Vitest 테스트 | |

## 4. 코드 규칙
- 언어: JavaScript (ESM) + React 함수 컴포넌트, 파일 확장자 `.jsx`(컴포넌트) / `.js`(로직)
- 스타일: Tailwind 유틸리티 + `src/styles/index.css`의 토큰만. **hex 색, 임의 px(`w-[37px]`) 금지** — 필요하면 토큰을 먼저 추가
- 아이콘: `lucide-react`만. 이모지를 UI에 쓰지 않는다
- 날짜: `new Date()`를 직접 쓰지 말고 `lib/date.js`의 `today()` 등을 사용 (가짜 날짜 테스트를 위해)
- 저장: `localStorage`를 직접 쓰지 말고 `lib/storage.js`만 통해 접근
- 무작위: `Math.random()` 대신 시드를 받을 수 있는 헬퍼 사용 (문제 생성 테스트 재현)
- 이름: 컴포넌트 PascalCase, 함수·변수 camelCase, 카드 id는 kebab-case (`web-server`)
- 주석: "왜"가 필요한 곳에만, 한국어 가능. spec 규칙을 구현한 곳은 `// spec 4.2` 처럼 근거 표기
- 새 라이브러리 추가는 spec 8장에 없는 경우 **먼저 이유를 설명하고 확인**받는다

## 5. 테스트
- `src/lib/`의 모든 함수는 테스트를 동반한다 (`tests/<모듈>.test.js`)
- spec 10장 완료 기준과 todo의 "완료 확인" 항목은 가능한 한 자동 테스트로 만든다
- 커밋 전: `npm run lint` · `npm test` 모두 통과

## 6. 명령어
| 명령 | 용도 |
|---|---|
| `npm install` | 의존성 설치 |
| `npm run dev` | 개발 서버 (http://localhost:5173) |
| `npm test` | 테스트 1회 실행 |
| `npm run test:watch` | 테스트 감시 모드 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier 정리 |
| `npm run build` | 배포용 빌드 (`dist/`) |

개발 중 날짜 이동: `http://localhost:5173/?now=2026-10-05` — 복습 일정을 며칠 뒤로 당겨 확인할 때 (개발 서버에서만 동작)

## 7. Git
- 기본 브랜치 `main`. 단계별 브랜치: `stage-5-leitner` 처럼
- 커밋 메시지: `[단계] 내용` — 예: `[5] 라이트너 grade() 오답 규칙 구현`
- 한 커밋 = 한 가지 변경. 포맷팅만 바꾼 변경은 따로 커밋
- `.env`, API 키, 개인 정보는 절대 커밋하지 않는다

## 8. 완료의 정의 (Definition of Done)
- [ ] todo.md의 해당 항목과 "완료 확인" 충족
- [ ] lint·test 통과
- [ ] UI 변경이면 DESIGN.md 하단 체크리스트 통과 (라이트/다크, 375px, 키보드, reduced-motion)
- [ ] todo.md 체크박스·진행 현황 갱신

## 9. 하지 말 것
- 요청 없이 기능 범위 확장 (P1·P2를 P0 작업 중에 끼워 넣기)
- 점수·콤보·타이머 추가 (PRD 5.3에서 의도적으로 제외)
- 데이터 구조(spec 5장) 임의 변경 — 바꿔야 하면 spec.md를 먼저 수정하고 이유를 남김
- PDF 문장을 그대로 복사한 카드 문구
