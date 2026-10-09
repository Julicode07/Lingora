import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { api, type NewEntry } from "@/lib/api"
import { EntryForm } from "@/components/EntryForm"

export function AddPage() {
  const [saved, setSaved] = useState<{ word: string; key: number } | null>(null)
  const [count, setCount] = useState(0)

  const submit = async (e: NewEntry) => {
    await api.add(e)
    setCount((c) => c + 1)
    setSaved({ word: e.english, key: Date.now() })
  }

  // El aviso se cierra solo; cada guardado reinicia el temporizador.
  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(null), 4500)
    return () => clearTimeout(t)
  }, [saved])

  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight">Add entry</h2>
          <p className="text-sm text-muted-foreground">
            Guarda una palabra, phrasal verb o expresión y aparecerá en tus repasos.
          </p>
        </div>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="shrink-0 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300"
          >
            +{count} esta sesión
          </motion.span>
        )}
      </header>

      <AnimatePresence>
        {saved && (
          <motion.div
            key={saved.key}
            role="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border border-violet-500/40 bg-violet-500/10 p-3 text-violet-300">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                <Check className="size-4" />
              </span>
              <p className="min-w-0 flex-1 text-sm">
                Guardaste <span className="font-medium break-words text-violet-200">"{saved.word}"</span>. Puedes
                agregar otra.
              </p>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => setSaved(null)}
                className="rounded-md p-1 outline-none hover:bg-violet-500/20 focus-visible:ring-2 focus-visible:ring-violet-400/70"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EntryForm onSubmit={submit} />
    </section>
  )
}