import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// npm run build        → dist/  (GitHub Pages 등 웹 배포용)
// npm run build:share  → share/index.html 한 파일 (메신저로 보내서 더블클릭으로 실행)
export default defineConfig(({ mode }) => {
  const share = mode === 'share'
  return {
    // 상대 경로: 하위 폴더 주소(https://이름.github.io/저장소/)와 file:// 모두에서 동작
    base: './',
    plugins: [react(), tailwindcss(), ...(share ? [viteSingleFile()] : [])],
    build: { outDir: share ? 'share' : 'dist' },
    test: {
      include: ['tests/**/*.test.js'],
    },
  }
})
