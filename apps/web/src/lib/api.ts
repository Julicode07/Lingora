export type EntryType = "word" | "phrasal" | "expression"
export type Category = "learning" | "mastered"

export type Entry = {
  id: string
  type: EntryType
  english: string
  meaning: string
  example: string
  exampleEs: string
  notes: string
  favorite: boolean
  category: Category
}

export type NewEntry = Pick<Entry, "type" | "english" | "meaning" | "example" | "exampleEs" | "notes"> & {
  category?: Category
}

export type EntryPatch = Partial<NewEntry & Pick<Entry, "favorite">>

export type ListParams = {
  q?: string
  type?: EntryType
  category?: Category
  favorite?: boolean
}

export const TYPE_LABEL: Record<EntryType, string> = {
  word: "Vocabulary",
  phrasal: "Phrasal verb",
  expression: "Expression",
}

export const CATEGORY_LABEL: Record<Category, string> = {
  learning: "Aprendiendo",
  mastered: "Dominada",
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${url}`, { headers: { "Content-Type": "application/json" }, ...init })
  if (!r.ok) throw new Error("No se pudo completar la solicitud. Revisa que la API esté encendida.")
  return r.status === 204 ? (undefined as T) : r.json()
}

const toQuery = (p: ListParams) =>
  new URLSearchParams(
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString()

export const api = {
  list: (p: ListParams = {}) => req<Entry[]>(`/entries?${toQuery(p)}`),
  add: (e: NewEntry) => req<Entry>("/entries", { method: "POST", body: JSON.stringify(e) }),
  update: (id: string, patch: EntryPatch) =>
    req<Entry>(`/entries/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string) => req<void>(`/entries/${id}`, { method: "DELETE" }),
  favorite: (id: string) => req<Entry>(`/entries/${id}/favorite`, { method: "PATCH" }),
}