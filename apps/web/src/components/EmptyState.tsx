
import { NavLink } from "react-router-dom"

export function EmptyState({
  title,
  text,
  cta,
}: {
  title: string
  text?: string
  cta?: boolean
}) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <p className="text-lg font-medium">{title}</p>

      {text && (
        <p className="mt-1 text-muted-foreground">{text}</p>
      )}

      {cta && (
        <NavLink
          to="/add"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Add your first entry
        </NavLink>
      )}
    </div>
  )
}