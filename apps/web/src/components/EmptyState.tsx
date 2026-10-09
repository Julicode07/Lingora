import { NavLink } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"

export function EmptyState({ title, text, cta }: { title: string; text?: string; cta?: boolean }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <p className="text-lg font-medium">{title}</p>
      {text && <p className="mt-1 text-muted-foreground">{text}</p>}
      {cta && <Button asChild className="mt-4"><NavLink to="/add">Add your first entry</NavLink></Button>}
    </div>
  )
}
