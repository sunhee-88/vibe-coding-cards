import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import LearningProvider from './state/LearningProvider.jsx'
import { setNow } from './lib/date.js'
import './styles/index.css'

// 개발 중 날짜 이동: http://localhost:5173/?now=2026-10-05 (복습 일정 확인용, 배포 빌드에서는 무시)
if (import.meta.env.DEV) {
  const now = new URLSearchParams(location.search).get('now')
  if (now) setNow(new Date(`${now}T12:00:00`))
}

// HashRouter(#/session): 서버 설정 없이 GitHub Pages와 파일 더블클릭(file://) 양쪽에서 동작한다
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <LearningProvider>
        <App />
      </LearningProvider>
    </HashRouter>
  </StrictMode>,
)
