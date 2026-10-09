import type { RequestHandler } from "express"
import type { ZodSchema } from "zod"

export const validate =
  (schema: ZodSchema): RequestHandler =>
  (req, res, next) => {
    const r = schema.safeParse(req.body)
    if (!r.success) return res.status(400).json({ error: "Datos inválidos", details: r.error.flatten().fieldErrors })
    req.body = r.data
    next()
  }
