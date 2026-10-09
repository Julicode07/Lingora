import { z } from "zod"
import { Entry, CATEGORIES } from "../models/Entry.js"
import { asyncHandler } from "../middlewares/error.js"

const TYPES = ["word", "phrasal", "expression"] as const

export const entryBody = z.object({
  type: z.enum(TYPES).default("word"),
  english: z.string().trim().min(1),
  meaning: z.string().trim().min(1),
  example: z.string().default(""),
  exampleEs: z.string().default(""),
  notes: z.string().default(""),
  category: z.enum(CATEGORIES).default("learning"),
})

// Todos los campos opcionales: solo se actualiza lo que se envía.
export const updateBody = z
  .object({
    type: z.enum(TYPES),
    english: z.string().trim().min(1),
    meaning: z.string().trim().min(1),
    example: z.string(),
    exampleEs: z.string(),
    notes: z.string(),
    category: z.enum(CATEGORIES),
    favorite: z.boolean(),
  })
  .partial()

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const notFound = { error: "No existe esa entrada" }

export const list = asyncHandler(async (req, res) => {
  const { q, type, category, favorite } = req.query as Record<string, string | undefined>
  const filter: Record<string, unknown> = {}
  if (q) {
    const re = new RegExp(escape(q), "i")
    filter.$or = [{ english: re }, { meaning: re }, { example: re }, { exampleEs: re }, { notes: re }]
  }
  if (type) filter.type = type
  if (category) filter.category = category
  if (favorite === "true") filter.favorite = true
  res.json(await Entry.find(filter).sort({ createdAt: -1 }))
})

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await Entry.create(req.body))
})

export const update = asyncHandler(async (req, res) => {
  const e = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!e) return res.status(404).json(notFound)
  res.json(e)
})

export const toggleFavorite = asyncHandler(async (req, res) => {
  const e = await Entry.findById(req.params.id)
  if (!e) return res.status(404).json(notFound)
  e.favorite = !e.favorite
  res.json(await e.save())
})

export const remove = asyncHandler(async (req, res) => {
  const e = await Entry.findByIdAndDelete(req.params.id)
  if (!e) return res.status(404).json(notFound)
  res.status(204).end()
})

export const exportAll = asyncHandler(async (_req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="lingora.json"')
  res.json(await Entry.find().sort({ createdAt: 1 }))
})