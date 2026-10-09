import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDown, Puzzle, Quote, RotateCcw, Search, Sprout, Star, Trophy, Type, X,
  type LucideIcon,
} from "lucide-react"
import { api, TYPE_LABEL, type Category, type Entry, type EntryType } from "@/lib/api"
import { cn } from "@workspace/ui/lib/utils"

/* ------------------------------ Metadatos ------------------------------ */

type Tab = "all" | EntryType
type Sort = "original" | "az" | "category" | "favorites"

const CATEGORY_ORDER: Category[] = ["learning", "mastered"]

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "word", label: "Vocabulary" },
  { id: "phrasal", label: "Phrasals" },
  { id: "expression", label: "Expressions" },
]

const TYPE_META: Record<EntryType, { icon: LucideIcon; className: string }> = {
  word: { icon: Type, className: "bg-sky-500/15 text-sky-300 ring-sky-400/30" },
  phrasal: { icon: Puzzle, className: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30" },
  expression: { icon: Quote, className: "bg-teal-500/15 text-teal-300 ring-teal-400/30" },
}

const CATEGORY_META: Record<Category, { label: string; icon: LucideIcon; className: string }> = {
  learning: { label: "Aprendiendo", icon: Sprout, className: "bg-violet-500/15 text-violet-300 ring-violet-400/30" },
  mastered: { label: "Dominada", icon: Trophy, className: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" },
}

const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"

/* ------------------------------ Piezas ------------------------------ */

function Badge({ icon: Icon, label, className }: { icon: LucideIcon; label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", className)}>
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}

function Field({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  if (!value?.trim()) return null
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn("whitespace-pre-wrap break-words", italic && "italic")}>{value}</dd>
    </div>
  )
}

const EntryRow = memo(function EntryRow({
  entry,
  onFavorite,
}: {
  entry: Entry
  onFavorite: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const type = TYPE_META[entry.type]
  const category = CATEGORY_META[entry.category]
  // Solo se puede expandir si hay algo que no se ve ya en la fila.
  const hasDetails = Boolean(entry.exampleEs?.trim() || entry.notes?.trim())

  return (
    <li className="overflow-hidden rounded-xl border border-border/60 bg-secondary/30">
      <div className="flex items-start">
        <button
          onClick={() => hasDetails && setOpen((o) => !o)}
          aria-expanded={hasDetails ? open : undefined}
          disabled={!hasDetails}
          className={cn(
            "flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition-colors",
            hasDetails ? "hover:bg-secondary/60" : "cursor-default",
            focusRing,
            "focus-visible:ring-inset"
          )}
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold tracking-tight">{entry.english}</span>
              <Badge icon={type.icon} label={TYPE_LABEL[entry.type]} className={type.className} />
              <Badge icon={category.icon} label={category.label} className={category.className} />
            </div>
            {entry.meaning && <p className="text-sm text-muted-foreground">{entry.meaning}</p>}
            {entry.example && (
              <p className="text-sm italic text-muted-foreground/80">“{entry.example}”</p>
            )}
          </div>
          {hasDetails && (
            <ChevronDown
              className={cn("mt-1.5 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            />
          )}
        </button>

        <button
          onClick={() => onFavorite(entry.id)}
          aria-label={entry.favorite ? "Quitar de favoritos" : "Marcar como favorito"}
          aria-pressed={entry.favorite}
          className={cn("p-3", focusRing, "focus-visible:ring-inset")}
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              entry.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-foreground"
            )}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <dl className="grid grid-cols-1 gap-3 border-t border-border/60 px-4 py-3 text-sm">
              <Field label="Ejemplo (ES)" value={entry.exampleEs} italic />
              <Field label="Notas" value={entry.notes} />
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
})

/* ------------------------------ Página ------------------------------ */

export function ReviewPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [tab, setTab] = useState<Tab>("all")
  const [category, setCategory] = useState<Category | "all">("all")
  const [sort, setSort] = useState<Sort>("original")
  const [onlyFav, setOnlyFav] = useState(false)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  const entriesRef = useRef(entries)
  entriesRef.current = entries

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setEntries(await api.list())
      setError("")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleFavorite = useCallback(async (id: string) => {
    const prev = entriesRef.current.find((e) => e.id === id)?.favorite
    if (prev === undefined) return
    const set = (favorite: boolean) =>
      setEntries((list) => list.map((e) => (e.id === id ? { ...e, favorite } : e)))
    set(!prev) // optimista
    try {
      const updated = await api.favorite(id)
      setEntries((list) => list.map((e) => (e.id === updated.id ? updated : e)))
    } catch (e: any) {
      set(prev) // vuelve al valor anterior exacto
      setError(e.message)
    }
  }, [])

  const counts = useMemo(() => {
    const byType: Record<Tab, number> = { all: entries.length, word: 0, phrasal: 0, expression: 0 }
    const byCategory: Record<Category, number> = { learning: 0, mastered: 0 }
    let favorites = 0
    for (const e of entries) {
      byType[e.type]++
      byCategory[e.category]++
      if (e.favorite) favorites++
    }
    return { byType, byCategory, favorites }
  }, [entries])

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const list = entries.filter((e) => {
      if (tab !== "all" && e.type !== tab) return false
      if (category !== "all" && e.category !== category) return false
      if (onlyFav && !e.favorite) return false
      if (q) {
        const hay = [e.english, e.meaning, e.example, e.exampleEs, e.notes].join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === "az") list.sort((a, b) => a.english.localeCompare(b.english, "en", { sensitivity: "base" }))
    else if (sort === "category") list.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
    else if (sort === "favorites") list.sort((a, b) => Number(b.favorite) - Number(a.favorite))
    return list
  }, [entries, tab, category, onlyFav, sort, deferredQuery])

  const hasFilters = tab !== "all" || category !== "all" || onlyFav || query.trim() !== ""
  const clearFilters = () => {
    setTab("all")
    setCategory("all")
    setOnlyFav(false)
    setQuery("")
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-4xl font-semibold tracking-tight">Tu vault</h2>
        <span className="text-sm tabular-nums text-muted-foreground">
          {visible.length} de {entries.length}
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <button
            onClick={load}
            className="inline-flex shrink-0 items-center gap-1.5 font-medium underline-offset-4 hover:underline"
          >
            <RotateCcw className="size-3.5" /> Reintentar
          </button>
        </div>
      )}

      {/* Pestañas por tipo */}
      <div role="tablist" aria-label="Tipo de entrada" className="flex gap-1 overflow-x-auto rounded-lg bg-secondary/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              focusRing,
              tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="vault-tab"
                className="absolute inset-0 rounded-md bg-secondary"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10">
              {t.label} <span className="tabular-nums opacity-60">{counts.byType[t.id]}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Búsqueda + orden */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en inglés, significado, ejemplos, notas…"
            aria-label="Buscar en el vault"
            className={cn("w-full rounded-md border border-border/60 bg-background py-2 pl-9 pr-9 text-sm", focusRing)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
              className={cn("absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground", focusRing)}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Ordenar por"
          className={cn("rounded-md border border-border/60 bg-background px-3 py-2 text-sm", focusRing)}
        >
          <option value="original">Orden original</option>
          <option value="az">A → Z</option>
          <option value="category">Por categoría</option>
          <option value="favorites">Favoritas primero</option>
        </select>
      </div>

      {/* Filtros: categoría + favoritas */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...CATEGORY_ORDER] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
              focusRing,
              category === c
                ? "bg-violet-500 text-white ring-violet-500"
                : "text-muted-foreground ring-border/60 hover:text-foreground"
            )}
          >
            {c === "all" ? "Todas las categorías" : CATEGORY_META[c].label}
            {c !== "all" && <span className="ml-1 tabular-nums opacity-60">{counts.byCategory[c]}</span>}
          </button>
        ))}
        <button
          onClick={() => setOnlyFav((f) => !f)}
          aria-pressed={onlyFav}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
            focusRing,
            onlyFav
              ? "bg-amber-500/20 text-amber-300 ring-amber-400/40"
              : "text-muted-foreground ring-border/60 hover:text-foreground"
          )}
        >
          <Star className={cn("size-3.5", onlyFav && "fill-amber-300")} />
          Favoritas <span className="tabular-nums opacity-60">{counts.favorites}</span>
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground", focusRing)}
          >
            <X className="size-3.5" /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {loading && entries.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
          {entries.length === 0 ? (
            "Aún no has guardado nada. Usa “Add entry” para empezar."
          ) : (
            <>
              Nada coincide con esos filtros.{" "}
              <button onClick={clearFilters} className="font-medium text-violet-400 underline-offset-4 hover:underline">
                Limpiar filtros
              </button>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => (
            <EntryRow key={e.id} entry={e} onFavorite={toggleFavorite} />
          ))}
        </ul>
      )}
    </section>
  )
}