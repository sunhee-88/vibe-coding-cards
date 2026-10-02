const WIDTHS = {
  wide: 'max-w-wide',
  narrow: 'max-w-narrow',
}

export default function Container({ width = 'wide', className = '', children }) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${WIDTHS[width]} ${className}`}>
      {children}
    </div>
  )
}
