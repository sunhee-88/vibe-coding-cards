import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Container from './Container.jsx'
import { NAV_ITEMS } from './navItems.js'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-20 border-b border-border transition-colors duration-150 ${
        scrolled ? 'bg-bg/90 backdrop-blur-sm' : 'bg-bg'
      }`}
    >
      <Container className="flex h-14 items-center justify-between md:h-16">
        <Link to="/" className="rounded-sm text-small font-semibold text-fg">
          바이브코딩 용어카드
        </Link>
        <nav aria-label="주 메뉴" className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `rounded-sm text-small font-medium transition-colors duration-150 hover:text-fg ${
                  isActive ? 'text-fg' : 'text-fg-muted'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </Container>
    </header>
  )
}
