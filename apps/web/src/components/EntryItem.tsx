import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { TYPE_LABEL, type Entry } from "@/lib/api"

type Props = { entry: Entry; onFavorite: () => void; onDelete: () => void }

export function EntryItem({ entry: e, onFavorite, onDelete }: Props) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="min-w-0">
        <p className="font-medium">{e.english} <span className="font-normal text-muted-foreground">· {e.meaning}</span></p>
        {e.example && <p className="truncate text-sm italic text-muted-foreground">{e.example}</p>}
        <div className="mt-2 flex gap-1">
          <Badge variant="outline">{TYPE_LABEL[e.type]}</Badge>
          <Badge variant="secondary">{e.category}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={onFavorite} aria-label="Favorite">{e.favorite ? "★" : "☆"}</Button>
        <Button size="sm" variant="ghost" onClick={() => confirm(`¿Eliminar "${e.english}"?`) && onDelete()}>Delete</Button>
      </div>
    </li>
  )
}
