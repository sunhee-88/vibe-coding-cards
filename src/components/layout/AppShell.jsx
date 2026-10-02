import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import TabBar from './TabBar.jsx'

export default function AppShell() {
  return (
    <div className="min-h-dvh bg-bg pb-14 md:pb-0">
      <Header />
      <main>
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
