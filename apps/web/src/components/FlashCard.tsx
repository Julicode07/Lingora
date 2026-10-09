import { useEffect, useState } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { TYPE_LABEL, type Entry, type Grade } from "@/lib/api"
import { speak } from "@/lib/settings"

type Props = { entry: Entry; reverse: boolean; autoSpeak: boolean; onToggleReverse: () => void; onGrade: (g: Grade) => void }

export function FlashCard({ entry, reverse, autoSpeak, onToggleReverse, onGrade }: Props) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    setShown(false)
    if (autoSpeak && !reverse) speak(entry.english)
  }, [entry.id, autoSpeak, reverse, entry.english])

  return (
    <article className="space-y-5 rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{TYPE_LABEL[entry.type]}</Badge>
        <Button size="sm" variant="ghost" onClick={onToggleReverse}>
          {reverse ? "Español → English" : "English → Español"}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <h3 className="text-4xl font-semibold tracking-tight">{reverse ? entry.meaning : entry.english}</h3>
        {!reverse && <Button size="sm" variant="outline" onClick={() => speak(entry.english)} aria-label="Listen">Listen</Button>}
      </div>
      {!shown ? (
        <>
          <p className="text-muted-foreground">Do you remember it?</p>
          <Button onClick={() => setShown(true)}>Show answer</Button>
        </>
      ) : (
        <>
          <div className="space-y-2 border-t pt-4">
            <p className="text-2xl text-violet-300">{reverse ? entry.english : entry.meaning}</p>
            {entry.example && <p className="italic">{entry.example}</p>}
            {entry.exampleEs && <p className="text-sm text-muted-foreground">{entry.exampleEs}</p>}
            {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="destructive" onClick={() => onGrade("forgot")}>Forgot</Button>
            <Button variant="secondary" onClick={() => onGrade("hard")}>Hard</Button>
            <Button onClick={() => onGrade("easy")}>Easy</Button>
          </div>
        </>
      )}
    </article>
  )
}
