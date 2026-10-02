// 버튼 스타일 (DESIGN.md 7장). <Link>에도 같은 모양을 입힐 수 있도록 클래스 함수로 분리한다.

const VARIANTS = {
  primary: 'bg-fg text-bg hover:opacity-90 active:opacity-80',
  secondary:
    'bg-surface text-fg border border-border hover:border-border-strong hover:bg-bg-hover active:bg-bg-active',
  ghost: 'text-fg-muted hover:text-fg hover:bg-bg-hover active:bg-bg-active',
  danger: 'bg-red text-white hover:opacity-90 active:opacity-80',
}

const SIZES = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-small',
  lg: 'h-12 px-5 text-body',
}

export function buttonClass({ variant = 'primary', size = 'md', block = false } = {}) {
  return [
    'inline-flex items-center justify-center gap-2 rounded font-medium whitespace-nowrap',
    'transition-[color,background-color,border-color,opacity] duration-150 ease-standard',
    'disabled:cursor-not-allowed disabled:opacity-40',
    VARIANTS[variant],
    SIZES[size],
    block ? 'w-full' : '',
  ].join(' ')
}
