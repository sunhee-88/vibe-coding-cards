export default function PageHeader({ title, description }) {
  return (
    <div className="pt-12 pb-8">
      <h1 className="text-h1-sm font-semibold md:text-h1">{title}</h1>
      {description && <p className="mt-2 text-body text-fg-muted">{description}</p>}
    </div>
  )
}
