import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react"
import {
    AnimatePresence,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useSpring,
    useTransform,
} from "framer-motion"
import { Check, RotateCw, Undo2, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Category = "learning" | "mastered"

export interface Entry {
    id: string
    front: string
    back: string
    note?: string
    category: Category
}

type Filter = "all" | Category

interface SwipeDeckProps {
    entries: Entry[]
    onCategoryChange: (id: string, category: Category) => void
}

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

const spring = { type: "spring", stiffness: 500, damping: 38 } as const

/** Px que hay que arrastrar la card para que cuente. Si sueltas antes, vuelve al centro. */
const THRESHOLD = 120
const STACK_SIZE = 3

/** Todo el deck comparte esta columna, así filtros, card y botones quedan alineados. */
const COLUMN = "mx-auto w-full max-w-sm sm:max-w-md"

const CATEGORY_META: Record<Category, { label: string; dot: string }> = {
    learning: { label: "Learning", dot: "bg-amber-400" },
    mastered: { label: "Mastered", dot: "bg-emerald-400" },
}

const FILTERS: { value: Filter; label: string; dot?: string }[] = [
    { value: "all", label: "All" },
    { value: "learning", label: "Learning", dot: CATEGORY_META.learning.dot },
    { value: "mastered", label: "Mastered", dot: CATEGORY_META.mastered.dot },
]

/** Cara de la card: mismo color de siempre, con borde de luz arriba y sombra para dar volumen. */
const FACE =
    "absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#1b1b1bff] px-7 py-14 text-center text-white [backface-visibility:hidden] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]"

const buildQueue = (entries: Entry[], filter: Filter) =>
    entries.filter((e) => filter === "all" || e.category === filter).map((e) => e.id)

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

/** Vive dentro de cada cara, así gira exactamente igual que la card. */
function CategoryBadge({ category }: { category: Category }) {
    return (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/10">
            <span className={cn("size-2 rounded-full", CATEGORY_META[category].dot)} />
            {CATEGORY_META[category].label}
        </div>
    )
}

interface SwipeCardProps {
    entry: Entry
    position: number
    flipped: boolean
    exitDir: number
    enterX: number
    onSwipe: (category: Category, dir: 1 | -1) => void
}

function SwipeCard({ entry, position, flipped, exitDir, enterX, onSwipe }: SwipeCardProps) {
    const isTop = position === 0

    /* --- Arrastre ---------------------------------------------------- */
    const x = useMotionValue(0)
    const [armed, setArmed] = useState(false)
    const armedRef = useRef(false)
    const draggingRef = useRef(false)

    // "armed" = ya pasó el umbral: si lo sueltas ahora, cuenta.
    useMotionValueEvent(x, "change", (v: number) => {
        const next = Math.abs(v) >= THRESHOLD
        armedRef.current = next
        setArmed(next)
    })

    function handleDragEnd() {
        draggingRef.current = false
        // Si no llegó al umbral, framer lo devuelve solo al origen (dragSnapToOrigin).
        if (!armedRef.current) return
        const dir = x.get() > 0 ? 1 : -1
        // Derecha = mastered, izquierda = learning.
        onSwipe(dir === 1 ? "mastered" : "learning", dir)
    }

    /* --- 3D: inclinación con el mouse + giro al arrastrar ----------- */
    const px = useMotionValue(0)
    const py = useMotionValue(0)
    const sx = useSpring(px, { stiffness: 220, damping: 20 })
    const sy = useSpring(py, { stiffness: 220, damping: 20 })

    const rotateZ = useTransform(x, [-250, 250], [-16, 16])
    const dragRotY = useTransform(x, [-250, 250], [-26, 26])
    const hoverRotY = useTransform(sx, [-0.5, 0.5], [-12, 12])
    const rotateY = useTransform([dragRotY, hoverRotY], ([a, b]: number[]) => a + b)
    const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10])

    function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
        if (!isTop || draggingRef.current || e.pointerType !== "mouse") return
        const r = e.currentTarget.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width - 0.5)
        py.set((e.clientY - r.top) / r.height - 0.5)
    }

    function resetTilt() {
        px.set(0)
        py.set(0)
    }

    /* --- Sellos y tintes según qué tan cerca está del umbral -------- */
    const masteredOpacity = useTransform(x, [THRESHOLD * 0.25, THRESHOLD], [0, 1])
    const learningOpacity = useTransform(x, [-THRESHOLD, -THRESHOLD * 0.25], [1, 0])
    const masteredScale = useTransform(x, [THRESHOLD * 0.5, THRESHOLD, THRESHOLD + 30], [0.7, 1, 1.12])
    const learningScale = useTransform(x, [-THRESHOLD - 30, -THRESHOLD, -THRESHOLD * 0.5], [1.12, 1, 0.7])
    const masteredTint = useTransform(x, [0, THRESHOLD], [0, 1])
    const learningTint = useTransform(x, [-THRESHOLD, 0], [1, 0])

    // Textos largos (phrasal verbs, expresiones) bajan un escalón para no desbordar.
    const frontSize = entry.front.length > 22 ? "text-2xl sm:text-4xl" : "text-4xl sm:text-5xl"
    const backSize = entry.back.length > 40 ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl"

    return (
        <motion.div
            custom={exitDir}
            variants={{
                exit: (dir: number) => ({
                    x: dir * 640,
                    y: 30,
                    opacity: 0,
                    transition: { duration: 0.3, ease: "easeIn" },
                }),
            }}
            initial={{ opacity: 0, scale: 0.9, y: 24, z: -120, x: isTop ? enterX : 0 }}
            animate={{
                opacity: 1,
                scale: 1 - position * 0.05,
                y: position * 18,
                z: -position * 60,
                x: 0,
            }}
            exit="exit"
            transition={spring}
            style={{
                x,
                rotateZ,
                rotateY: isTop ? rotateY : 0,
                rotateX: isTop ? rotateX : 0,
                zIndex: STACK_SIZE - position,
                transformStyle: "preserve-3d",
            }}
            drag={isTop ? "x" : false}
            dragSnapToOrigin={!armed}
            dragMomentum={false}
            dragTransition={{ bounceStiffness: 450, bounceDamping: 26 }}
            onDragStart={() => {
                draggingRef.current = true
                resetTilt()
            }}
            onDragEnd={handleDragEnd}
            onPointerMove={handlePointerMove}
            onPointerLeave={resetTilt}
            whileDrag={{ scale: 1.05, z: 40 }}
            className={cn(
                "absolute inset-0 select-none [-webkit-tap-highlight-color:transparent]",
                isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
            )}
        >
            {/* Giro frente / reverso */}
            <motion.div
                className="relative size-full"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Frente */}
                <div className={cn(FACE, "gap-3")}>
                    <CategoryBadge category={entry.category} />
                    <p
                        className={cn(
                            "leading-tight font-semibold tracking-tight text-balance break-words",
                            frontSize
                        )}
                    >
                        {entry.front}
                    </p>
                </div>

                {/* Reverso */}
                <div className={cn(FACE, "gap-5")} style={{ transform: "rotateY(180deg)" }}>
                    <CategoryBadge category={entry.category} />
                    <p
                        className={cn(
                            "leading-snug font-medium tracking-tight text-balance break-words",
                            backSize
                        )}
                    >
                        {entry.back}
                    </p>
                    {entry.note && (
                        <>
                            <span className="h-px w-10 bg-white/15" />
                            <p className="max-w-[30ch] text-sm leading-relaxed text-white/60 italic sm:text-base">
                                {entry.note}
                            </p>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Capa flotante: profundidad, tintes y sellos (un poco adelante de la card) */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{ transform: "translateZ(2px)" }}
            >
                {/* Las cards de atrás se oscurecen para que el stack tenga profundidad */}
                <motion.div
                    initial={false}
                    animate={{ opacity: Math.min(position * 0.28, 0.56) }}
                    className="absolute inset-0 rounded-3xl bg-black"
                />

                {isTop && (
                    <>
                        <motion.div
                            style={{ opacity: masteredTint }}
                            className="absolute inset-0 rounded-3xl bg-emerald-400/15 ring-2 ring-emerald-400/60 ring-inset"
                        />
                        <motion.div
                            style={{ opacity: learningTint }}
                            className="absolute inset-0 rounded-3xl bg-amber-400/15 ring-2 ring-amber-400/60 ring-inset"
                        />
                        <motion.div
                            style={{ opacity: masteredOpacity, scale: masteredScale, rotate: -12 }}
                            className="absolute top-14 left-5 flex items-center gap-1.5 rounded-xl border-2 border-emerald-400 bg-black/60 px-2.5 py-1 text-base font-bold text-emerald-400 sm:px-3 sm:py-1.5 sm:text-lg"
                        >
                            <Check className="size-5" /> Got it
                        </motion.div>
                        <motion.div
                            style={{ opacity: learningOpacity, scale: learningScale, rotate: 12 }}
                            className="absolute top-14 right-5 flex items-center gap-1.5 rounded-xl border-2 border-amber-400 bg-black/60 px-2.5 py-1 text-base font-bold text-amber-400 sm:px-3 sm:py-1.5 sm:text-lg"
                        >
                            <X className="size-5" /> Still learning
                        </motion.div>
                    </>
                )}
            </div>
        </motion.div>
    )
}

/* ------------------------------------------------------------------ */
/* Botones de acción                                                   */
/* ------------------------------------------------------------------ */

const TONE = {
    learning:
        "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:border-amber-400/70 hover:bg-amber-400/20",
    mastered:
        "border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:border-emerald-400/70 hover:bg-emerald-400/20",
    neutral: "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
} as const

interface ActionButtonProps {
    label: string
    hint?: string
    onClick: () => void
    disabled?: boolean
    size: "lg" | "sm"
    tone: keyof typeof TONE
    children: ReactNode
}

/** Botón redondo con su etiqueta debajo; el hint (atajo de teclado) solo aparece en desktop. */
function ActionButton({ label, hint, onClick, disabled, size, tone, children }: ActionButtonProps) {
    return (
        <div className={cn("flex flex-col items-center gap-2 transition-opacity", disabled && "opacity-40")}>
            <motion.button
                type="button"
                aria-label={label}
                onClick={onClick}
                disabled={disabled}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.9 }}
                transition={spring}
                className={cn(
                    "flex items-center justify-center rounded-full border outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-violet-400/70 disabled:pointer-events-none",
                    size === "lg" ? "size-16" : "size-12",
                    TONE[tone]
                )}
            >
                {children}
            </motion.button>
            <span className="text-xs font-medium text-muted-foreground">
                {label}
                {hint && <span className="ml-1 hidden opacity-60 sm:inline">{hint}</span>}
            </span>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Mensaje de fin de mazo                                              */
/* ------------------------------------------------------------------ */

interface DeckMessageProps {
    title: string
    text: string
    delay?: number
    onRestart?: () => void
}

/**
 * Se queda montado junto al stack, así la última card termina de salir
 * (con botones o con swipe) y después aparece el mensaje con un fade en CSS.
 */
function DeckMessage({ title, text, delay = 0, onRestart }: DeckMessageProps) {
    const [visible, setVisible] = useState(delay === 0)

    useEffect(() => {
        if (delay === 0) return
        const t = setTimeout(() => setVisible(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    return (
        <div
            className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed p-8 text-center transition-all duration-300",
                visible ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
            )}
        >
            <p className="text-lg font-semibold">{title}</p>
            <p className="max-w-[28ch] text-sm text-muted-foreground">{text}</p>
            {onRestart && (
                <button
                    type="button"
                    onClick={onRestart}
                    className="mt-2 rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white outline-none transition-transform hover:bg-violet-400 focus-visible:ring-2 focus-visible:ring-violet-300 active:scale-95"
                >
                    Restart deck
                </button>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Deck                                                                */
/* ------------------------------------------------------------------ */

export function SwipeDeck({ entries, onCategoryChange }: SwipeDeckProps) {
    const [filter, setFilter] = useState<Filter>("all")
    const [queue, setQueue] = useState<string[]>(() => buildQueue(entries, "all"))
    const [index, setIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [exitDir, setExitDir] = useState(0)
    const [enterX, setEnterX] = useState(0)
    const [history, setHistory] = useState<{ id: string; prev: Category; dir: 1 | -1 }[]>([])
    const [resetKey, setResetKey] = useState(0)

    const entriesRef = useRef(entries)
    entriesRef.current = entries

    // Reconstruye la cola al cambiar de filtro, al reiniciar o al agregar/borrar cards.
    useEffect(() => {
        setQueue(buildQueue(entriesRef.current, filter))
        setIndex(0)
        setHistory([])
        setFlipped(false)
        setExitDir(0)
        setEnterX(0)
    }, [filter, resetKey, entries.length])

    const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries])

    const counts = useMemo(() => {
        const c: Record<Filter, number> = { all: entries.length, learning: 0, mastered: 0 }
        for (const e of entries) c[e.category]++
        return c
    }, [entries])

    const current = byId.get(queue[index] ?? "")
    const visible = queue
        .slice(index, index + STACK_SIZE)
        .map((id) => byId.get(id))
        .filter((e): e is Entry => Boolean(e))

    const commit = useCallback(
        (category: Category, dir: 1 | -1) => {
            if (!current) return
            setHistory((h) => [...h, { id: current.id, prev: current.category, dir }])
            setExitDir(dir)
            setEnterX(0)
            setFlipped(false)
            setIndex((i) => i + 1)
            // Fuera del ciclo de framer: si tu callback lanza un error, no rompe las animaciones.
            if (current.category !== category) {
                const id = current.id
                queueMicrotask(() => onCategoryChange(id, category))
            }
        },
        [current, onCategoryChange]
    )

    const undo = useCallback(() => {
        const last = history[history.length - 1]
        if (!last) return
        setHistory((h) => h.slice(0, -1))
        setExitDir(0)
        setEnterX(last.dir * 480) // la card vuelve desde el lado por el que salió
        setFlipped(false)
        setIndex((i) => Math.max(0, i - 1))
        queueMicrotask(() => onCategoryChange(last.id, last.prev))
    }, [history, onCategoryChange])

    // Atajos de teclado: ← learning, → mastered. Voltear solo con el botón.
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.repeat) return // mantener la tecla pulsada no debe pasar muchas cards
            const target = e.target as HTMLElement | null
            if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return
            if (target?.closest("[role='tablist']")) return // no swipear mientras navegas los filtros
            if (e.key === "ArrowRight") commit("mastered", 1)
            else if (e.key === "ArrowLeft") commit("learning", -1)
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [commit])

    const pct = queue.length ? (Math.min(index, queue.length) / queue.length) * 100 : 0
    const finished = queue.length > 0 && index >= queue.length

    return (
        // El clip va al ancho de la pantalla para que la card pueda salir volando sin crear scroll horizontal.
        <div className="-mx-4 px-4 [overflow-x:clip]">
            <div className={cn(COLUMN, "flex flex-col gap-5 sm:gap-6")}>
                {/* Filtros */}
                <div
                    role="tablist"
                    aria-label="Filter cards by category"
                    className="grid grid-cols-3 gap-1 rounded-2xl border bg-muted/60 p-1"
                >
                    {FILTERS.map((f) => {
                        const active = filter === f.value
                        return (
                            <button
                                key={f.value}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setFilter(f.value)}
                                className={cn(
                                    "relative flex items-center justify-center gap-1.5 rounded-xl px-1.5 py-2 text-[13px] font-medium whitespace-nowrap outline-none transition-colors sm:text-sm",
                                    "focus-visible:ring-2 focus-visible:ring-violet-400/70",
                                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="deck-filter-pill"
                                        transition={spring}
                                        className="absolute inset-0 rounded-xl bg-background shadow-sm ring-1 ring-white/10"
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-1.5">
                                    {f.dot && <span className={cn("size-2 rounded-full", f.dot)} />}
                                    {f.label}
                                </span>
                                <span
                                    className={cn(
                                        "relative z-10 min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 tabular-nums transition-colors",
                                        active
                                            ? "bg-foreground/10 text-foreground"
                                            : "bg-foreground/5 text-muted-foreground"
                                    )}
                                >
                                    {counts[f.value]}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Progreso */}
                {queue.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <motion.div
                                className="h-full rounded-full bg-violet-400"
                                animate={{ width: `${pct}%` }}
                                transition={spring}
                            />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                            {Math.min(index + 1, queue.length)} / {queue.length}
                        </span>
                    </div>
                )}

                {/* Stack de cards + mensaje de fin. La altura se adapta a la pantalla para que los botones siempre se vean. */}
                <div
                    className="relative h-[clamp(18rem,calc(100svh-24rem),30rem)] w-full"
                    style={{ perspective: 1400 }}
                >
                    <AnimatePresence initial={false} custom={exitDir}>
                        {visible
                            .map((entry, position) => ({ entry, position }))
                            .reverse()
                            .map(({ entry, position }) => (
                                <SwipeCard
                                    key={entry.id}
                                    entry={entry}
                                    position={position}
                                    flipped={position === 0 && flipped}
                                    exitDir={exitDir}
                                    enterX={enterX}
                                    onSwipe={commit}
                                />
                            ))}
                    </AnimatePresence>

                    {queue.length === 0 && (
                        <DeckMessage
                            key="empty"
                            title="No cards here yet"
                            text="Pick another category or add a new entry."
                        />
                    )}
                    {finished && (
                        <DeckMessage
                            key="done"
                            delay={320}
                            title="You've gone through this deck"
                            text="Restart to review it again, or switch to another category."
                            onRestart={() => setResetKey((k) => k + 1)}
                        />
                    )}
                </div>

                {/* Acciones */}
                {queue.length > 0 && (
                    <div className="flex items-end justify-center gap-5 sm:gap-8">
                        <ActionButton
                            label="Undo"
                            size="sm"
                            tone="neutral"
                            onClick={undo}
                            disabled={history.length === 0}
                        >
                            <Undo2 className="size-5" />
                        </ActionButton>
                        <ActionButton
                            label="Learning"
                            hint="←"
                            size="lg"
                            tone="learning"
                            onClick={() => commit("learning", -1)}
                            disabled={!current}
                        >
                            <X className="size-7" />
                        </ActionButton>
                        <ActionButton
                            label="Mastered"
                            hint="→"
                            size="lg"
                            tone="mastered"
                            onClick={() => commit("mastered", 1)}
                            disabled={!current}
                        >
                            <Check className="size-7" />
                        </ActionButton>
                        <ActionButton
                            label="Flip"
                            size="sm"
                            tone="neutral"
                            onClick={() => setFlipped((f) => !f)}
                            disabled={!current}
                        >
                            <motion.span animate={{ rotate: flipped ? 180 : 0 }} transition={{ ...spring }}>
                                <RotateCw className="size-5" />
                            </motion.span>
                        </ActionButton>
                    </div>
                )}
            </div>
        </div>
    )
}