import { useEffect, useState } from "react"
import { Check, Pencil, RotateCcw, Save, Star, Trash2, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import {
  api, CATEGORY_LABEL, TYPE_LABEL,
  type Category, type Entry, type EntryPatch, type EntryType,
} from "@/lib/api"
import { EmptyState } from "@/components/EmptyState"

const field =
  "w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"

const CATEGORY_STYLE: Record<Category, string> = {
  learning: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  mastered: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
}

/* ------------------------------ Fila ------------------------------ */

type RowProps = {
  entry: Entry
  onFavorite: (id: string) => void
  onSave: (id: string, patch: EntryPatch) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function EntryCard({ entry, onFavorite, onSave, onDelete }: RowProps) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState(entry)

  const startEdit = () => { setDraft(entry); setEditing(true); setConfirming(false) }
  const set = <K extends keyof Entry>(k: K, v: Entry[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const valid = draft.english.trim() !== "" && draft.meaning.trim() !== ""

  const run = async (fn: () => Promise<void>, after?: () => void) => {
    setBusy(true)
    try { await fn(); after?.() } catch { /* el error ya se muestra arriba */ } finally { setBusy(false) }
  }

  const save = () =>
    run(
      () => onSave(entry.id, {
        type: draft.type,
        english: draft.english.trim(),
        meaning: draft.meaning.trim(),
        example: draft.example,
        exampleEs: draft.exampleEs,
        notes: draft.notes,
        category: draft.category,
      }),
      () => setEditing(false)
    )

  const toggleCategory = () =>
    run(() => onSave(entry.id, { category: entry.category === "mastered" ? "learning" : "mastered" }))

  /* ---- Modo edición ---- */
  if (editing) {
    return (
      <li
        className="space-y-3 rounded-xl border border-violet-400/40 bg-secondary/30 p-4"
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            English
            <Input value={draft.english} onChange={(e) => set("english", e.target.value)} autoFocus />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Significado
            <Input value={draft.meaning} onChange={(e) => set("meaning", e.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Tipo
            <select className={field} value={draft.type} onChange={(e) => set("type", e.target.value as EntryType)}>
              {Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Estado
            <select className={field} value={draft.category} onChange={(e) => set("category", e.target.value as Category)}>
              {Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Ejemplo
            <textarea className={field} rows={2} value={draft.example} onChange={(e) => set("example", e.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Ejemplo (ES)
            <textarea className={field} rows={2} value={draft.exampleEs} onChange={(e) => set("exampleEs", e.target.value)} />
          </label>
        </div>
        <label className="block space-y-1 text-xs text-muted-foreground">
          Notas
          <textarea className={field} rows={2} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
        </label>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
            <X className="size-4" /> Cancelar
          </Button>
          <Button size="sm" onClick={save} disabled={!valid || busy}>
            <Save className="size-4" /> Guardar
          </Button>
        </div>
      </li>
    )
  }

  /* ---- Modo lectura ---- */
  return (
    <li className={cn("rounded-xl border border-border/60 bg-secondary/30 p-4 transition-opacity", busy && "opacity-60")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">{entry.english}</span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {TYPE_LABEL[entry.type]}
            </span>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", CATEGORY_STYLE[entry.category])}>
              {CATEGORY_LABEL[entry.category]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{entry.meaning}</p>
          {entry.example && <p className="text-sm italic text-muted-foreground/80">“{entry.example}”</p>}
          {entry.exampleEs && <p className="text-sm italic text-muted-foreground/60">“{entry.exampleEs}”</p>}
          {entry.notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground/80">{entry.notes}</p>}
        </div>

        <button
          onClick={() => onFavorite(entry.id)}
          aria-label={entry.favorite ? "Quitar de favoritos" : "Marcar como favorito"}
          aria-pressed={entry.favorite}
          className="rounded p-1 outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
        >
          <Star className={cn("size-5 transition-colors", entry.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-foreground")} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
        {confirming ? (
          <>
            <span className="text-sm text-destructive">¿Eliminar “{entry.english}”?</span>
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => run(() => onDelete(entry.id))}>
              Sí, eliminar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancelar</Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" disabled={busy} onClick={toggleCategory}>
              {entry.category === "mastered"
                ? <><RotateCcw className="size-4" /> Volver a aprendiendo</>
                : <><Check className="size-4" /> Marcar dominada</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={startEdit}>
              <Pencil className="size-4" /> Editar
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
              <Trash2 className="size-4" /> Eliminar
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

/* ------------------------------ Página ------------------------------ */

export function CollectionPage() {
  const [q, setQ] = useState("")
  const [type, setType] = useState<EntryType | "">("")
  const [category, setCategory] = useState<Category | "">("")
  const [favorite, setFavorite] = useState(false)
  const [items, setItems] = useState<Entry[]>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  // Carga con debounce; `cancelled` evita que una respuesta vieja pise a una nueva.
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      setLoading(true)
      api
        .list({
          q: q.trim() || undefined,
          type: type || undefined,
          category: category || undefined,
          favorite: favorite || undefined,
        })
        .then((d) => { if (!cancelled) { setItems(d); setError("") } })
        .catch((e: Error) => { if (!cancelled) setError(e.message) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, type, category, favorite, reloadKey])

  // Tras editar, si la entrada ya no cumple los filtros activos, sale de la lista.
  const stillMatches = (e: Entry) =>
    (!type || e.type === type) && (!category || e.category === category) && (!favorite || e.favorite)

  const replace = (updated: Entry) =>
    setItems((list) => list?.flatMap((e) => (e.id !== updated.id ? [e] : stillMatches(updated) ? [updated] : [])))

  const save = async (id: string, patch: EntryPatch) => {
    try { replace(await api.update(id, patch)); setError("") }
    catch (e: any) { setError(e.message); throw e }
  }

  const remove = async (id: string) => {
    try { await api.remove(id); setItems((l) => l?.filter((e) => e.id !== id)); setError("") }
    catch (e: any) { setError(e.message); throw e }
  }

  const toggleFavorite = async (id: string) => {
    try { replace(await api.favorite(id)); setError("") }
    catch (e: any) { setError(e.message) }
  }

  const hasFilters = q !== "" || type !== "" || category !== "" || favorite
  const clearFilters = () => { setQ(""); setType(""); setCategory(""); setFavorite(false) }

  const chip = (active: boolean) => (active ? "default" : "outline") as "default" | "outline"

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-3xl font-semibold tracking-tight">My collection</h2>
        {items && <span className="text-sm tabular-nums text-muted-foreground">{items.length} {items.length === 1 ? "entrada" : "entradas"}</span>}
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{error}</span>
          <button onClick={() => setReloadKey((k) => k + 1)} className="inline-flex shrink-0 items-center gap-1.5 font-medium hover:underline">
            <RotateCcw className="size-3.5" /> Reintentar
          </button>
        </div>
      )}

      <Input
        placeholder="Buscar en inglés, significado, ejemplos o notas"
        aria-label="Buscar"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={chip(type === "")} onClick={() => setType("")}>All</Button>
        {(Object.entries(TYPE_LABEL) as [EntryType, string][]).map(([k, l]) => (
          <Button key={k} size="sm" variant={chip(type === k)} onClick={() => setType(k)}>{l}</Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={chip(category === "")} onClick={() => setCategory("")}>Todos los estados</Button>
        {(Object.entries(CATEGORY_LABEL) as [Category, string][]).map(([k, l]) => (
          <Button key={k} size="sm" variant={chip(category === k)} onClick={() => setCategory(k)}>{l}</Button>
        ))}
        <Button size="sm" variant={chip(favorite)} onClick={() => setFavorite((f) => !f)} aria-pressed={favorite}>
          <Star className={cn("size-4", favorite && "fill-current")} /> Favorites
        </Button>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            <X className="size-4" /> Limpiar
          </Button>
        )}
      </div>

      {loading && !items ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary/60" />)}
        </div>
      ) : items && items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Sin resultados" : "Tu colección está vacía"}
          text={hasFilters ? "Prueba con otro filtro o agrega una entrada nueva." : "Agrega tu primera entrada para empezar."}
        />
      ) : (
        <ul className={cn("space-y-2 transition-opacity", loading && "opacity-60")}>
          {items?.map((e) => (
            <EntryCard key={e.id} entry={e} onFavorite={toggleFavorite} onSave={save} onDelete={remove} />
          ))}
        </ul>
      )}
    </section>
  )
}