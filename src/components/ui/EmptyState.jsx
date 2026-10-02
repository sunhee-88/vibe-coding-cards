// 빈 상태: 아이콘 없이 텍스트 2줄 + 버튼 1개 (DESIGN.md 16장)
export default function EmptyState({ title, description, action }) {
  return (
    <div className="border-y border-border py-12">
      <p className="text-h3 font-semibold">{title}</p>
      {description && <p className="mt-2 text-small text-fg-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
