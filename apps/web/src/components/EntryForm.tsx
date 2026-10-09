import { useEffect, useState } from "react"
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Link2, Loader2, Quote, Type, type LucideIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { TYPE_LABEL, type EntryType, type NewEntry } from "@/lib/api"

const empty: NewEntry = { type: "word", english: "", meaning: "", example: "", exampleEs: "", notes: "" }

const spring = { type: "spring", stiffness: 500, damping: 38 } as const

const TYPE_META: Record<EntryType, { icon: LucideIcon; placeholder: string; hint: string }> = {
  word: {
    icon: Type,
    placeholder: "e.g. Reluctant",
    hint: "Una palabra suelta que quieres recordar.",
  },
  phrasal: {
    icon: Link2,
    placeholder: "e.g. Give up",
    hint: "Verbo + partícula: give up, look after, run into…",
  },
  expression: {
    icon: Quote,
    placeholder: "e.g. Piece of cake",
    hint: "Frase hecha o modismo con significado propio.",
  },
}

/** Misma cara que las cards del mazo, para que el preview sea fiel. */
const FACE =
  "absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#1b1b1bff] px-5 py-10 text-center text-white [backface-visibility:hidden] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]"

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

function Field({
  label,
  htmlFor,
  optional,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  optional?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {optional && <span className="text-xs text-muted-foreground">Opcional</span>}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  pillId,
  className,
}: {
  label: string
  value: T
  options: { value: T; label: string; icon?: LucideIcon }[]
  onChange: (v: T) => void
  pillId: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-1 rounded-2xl border bg-muted/60 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = value === o.value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-medium whitespace-nowrap outline-none transition-colors sm:text-sm",
              "focus-visible:ring-2 focus-visible:ring-violet-400/70",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                transition={spring}
                className="absolute inset-0 rounded-xl bg-background shadow-sm ring-1 ring-white/10"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon className="hidden size-4 sm:block" />}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Cómo va a verse la card en tu mazo, actualizado mientras escribes. */
function EntryPreview({ entry }: { entry: NewEntry }) {
  const [side, setSide] = useState<"front" | "back">("front")

  const english = entry.english.trim()
  const meaning = entry.meaning.trim()
  const example = entry.example.trim()

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Preview</p>
        <p className="text-xs text-muted-foreground">Así se verá en tus cards</p>
      </div>

      <div className="relative h-44 md:h-72" style={{ perspective: 1200 }}>
        <motion.div
          className="relative size-full"
          animate={{ rotateY: side === "back" ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Frente */}
          <div className={FACE}>
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium ring-1 ring-white/10">
              <span className="size-2 rounded-full bg-violet-400" />
              {TYPE_LABEL[entry.type]}
            </span>
            <p
              className={cn(
                "leading-tight font-semibold tracking-tight text-balance break-words",
                english.length > 22 ? "text-xl md:text-3xl" : "text-3xl md:text-4xl",
                !english && "text-white/25"
              )}
            >
              {english || "Your word"}
            </p>
          </div>

          {/* Reverso */}
          <div className={cn(FACE, "gap-3")} style={{ transform: "rotateY(180deg)" }}>
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium ring-1 ring-white/10">
              <span className="size-2 rounded-full bg-violet-400" />
              {TYPE_LABEL[entry.type]}
            </span>
            <p
              className={cn(
                "leading-snug font-medium tracking-tight text-balance break-words",
                meaning.length > 40 ? "text-lg md:text-2xl" : "text-2xl md:text-3xl",
                !meaning && "text-white/25"
              )}
            >
              {meaning || "Meaning"}
            </p>
            {example && (
              <>
                <span className="h-px w-8 bg-white/15" />
                <p className="line-clamp-3 max-w-[28ch] text-xs leading-relaxed text-white/60 italic md:text-sm">
                  {example}
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <Segmented
        label="Preview side"
        value={side}
        onChange={setSide}
        pillId="preview-side-pill"
        options={[
          { value: "front", label: "Front" },
          { value: "back", label: "Back" },
        ]}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Formulario                                                          */
/* ------------------------------------------------------------------ */

const focusEnglish = () => {
  // Solo en pantallas grandes: en móvil abrir el teclado solo sería molesto.
  if (window.matchMedia("(min-width: 768px)").matches) {
    document.getElementById("entry-english")?.focus()
  }
}

export function EntryForm({ onSubmit }: { onSubmit: (e: NewEntry) => Promise<void> }) {
  const [f, setF] = useState<NewEntry>(empty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const set = (k: keyof NewEntry) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }))

  const valid = Boolean(f.english.trim() && f.meaning.trim())
  const dirty = Boolean(f.english || f.meaning || f.example || f.exampleEs || f.notes)
  const meta = TYPE_META[f.type]

  useEffect(focusEnglish, [])

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError("")
    try {
      const example = f.example.trim()
      await onSubmit({
        ...f,
        english: f.english.trim(),
        meaning: f.meaning.trim(),
        example,
        exampleEs: example ? f.exampleEs.trim() : "",
        notes: f.notes.trim(),
      })
      setF({ ...empty, type: f.type })
      focusEnglish()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar. Inténtalo de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  // Ctrl/⌘ + Enter guarda desde cualquier campo (útil en las notas).
  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.currentTarget.requestSubmit()
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_19rem] md:items-start">
      {/* En móvil el preview va arriba para verlo mientras escribes; en desktop queda fijo a la derecha. */}
      <aside className="order-first md:sticky md:top-24 md:order-last">
        <EntryPreview entry={f} />
      </aside>

      <form onSubmit={submit} onKeyDown={onKeyDown} className="space-y-6">
        <div className="space-y-5 rounded-2xl border bg-card/40 p-4 sm:p-5">
          <Field label="Type" htmlFor="entry-type" hint={meta.hint}>
            <Segmented
              label="Entry type"
              value={f.type}
              onChange={(t) => setF((prev) => ({ ...prev, type: t }))}
              pillId="entry-type-pill"
              options={(Object.keys(TYPE_LABEL) as EntryType[]).map((t) => ({
                value: t,
                label: TYPE_LABEL[t],
                icon: TYPE_META[t].icon,
              }))}
            />
          </Field>

          <Field label="English" htmlFor="entry-english">
            <Input
              id="entry-english"
              className="h-11"
              placeholder={meta.placeholder}
              value={f.english}
              onChange={set("english")}
              autoComplete="off"
              autoCapitalize="off"
              required
            />
          </Field>

          <Field label="Meaning" htmlFor="entry-meaning" hint="Significado en español.">
            <Input
              id="entry-meaning"
              className="h-11"
              placeholder="Ej. Rendirse"
              value={f.meaning}
              onChange={set("meaning")}
              autoComplete="off"
              required
            />
          </Field>
        </div>

        <div className="space-y-5 rounded-2xl border bg-card/40 p-4 sm:p-5">
          <Field
            label="Example"
            htmlFor="entry-example"
            optional
            hint="Una frase real te ayuda a recordar cómo se usa."
          >
            <Input
              id="entry-example"
              className="h-11"
              placeholder="I never give up on my goals."
              value={f.example}
              onChange={set("example")}
              autoComplete="off"
            />
          </Field>

          {/* La traducción solo aparece cuando ya escribiste un ejemplo. */}
          <AnimatePresence initial={false}>
            {f.example.trim() && (
              <motion.div
                key="example-es"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <Field label="Translation" htmlFor="entry-example-es" optional>
                  <Input
                    id="entry-example-es"
                    className="h-11"
                    placeholder="Nunca me rindo con mis metas."
                    value={f.exampleEs}
                    onChange={set("exampleEs")}
                    autoComplete="off"
                  />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          <Field label="Notes" htmlFor="entry-notes" optional>
            <Textarea
              id="entry-notes"
              className="min-h-24"
              placeholder="Sinónimos, diferencias de uso, trucos para recordarlo…"
              value={f.notes}
              onChange={set("notes")}
            />
          </Field>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              key="error"
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={busy || !valid}
            className="h-11 flex-1 bg-violet-500 text-white hover:bg-violet-400 sm:flex-none sm:px-8"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save entry"
            )}
          </Button>

          {dirty && !busy && (
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={() => {
                setF({ ...empty, type: f.type })
                setError("")
                focusEnglish()
              }}
            >
              Clear
            </Button>
          )}

          <p className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">
            {dirty && !valid ? (
              "Completa English y Meaning para guardar."
            ) : (
              <span className="hidden sm:inline">⌘ / Ctrl + Enter para guardar</span>
            )}
          </p>
        </div>
      </form>
    </div>
  )
}