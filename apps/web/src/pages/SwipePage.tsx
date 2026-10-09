import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SwipeDeck, type Entry as DeckEntry, type Category } from "@/components/SwipeDeck"
import { api, type Entry } from "@/lib/api"

export function SwipePage() {
    const [entries, setEntries] = useState<Entry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const entriesRef = useRef(entries)
    entriesRef.current = entries

    useEffect(() => {
        let cancelled = false
        api
            .list({})
            .then((data) => !cancelled && setEntries(data))
            .catch((e: Error) => !cancelled && setError(e.message))
            .finally(() => !cancelled && setLoading(false))
        return () => {
            cancelled = true
        }
    }, [])

    // Tu Entry -> el formato del deck.
    const deckEntries = useMemo<DeckEntry[]>(
        () =>
            entries.map((e) => ({
                id: e.id,
                front: e.english,
                back: e.meaning,
                note: e.example || undefined,
                // El deck solo conoce 2 estados: "learning" y "mastered".
                category: e.category,
            })),
        [entries]
    )

    // Optimista: la UI cambia al instante; si la API falla, vuelve al estado anterior.
    const handleCategoryChange = useCallback((id: string, category: Category) => {
        const previous = entriesRef.current.find((e) => e.id === id)?.category
        setEntries((list) => list.map((e) => (e.id === id ? { ...e, category } : e)))

        api.update(id, { category }).catch(() => {
            if (previous) {
                setEntries((list) => list.map((e) => (e.id === id ? { ...e, category: previous } : e)))
            }
        })
    }, [])

    if (loading) {
        return <p className="py-12 text-center text-sm text-muted-foreground">Loading your cards…</p>
    }
    if (error) {
        return <p className="py-12 text-center text-sm text-destructive">{error}</p>
    }

    return <SwipeDeck entries={deckEntries} onCategoryChange={handleCategoryChange} />
}