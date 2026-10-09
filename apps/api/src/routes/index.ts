import { Router } from "express"
import * as c from "../controllers/entry.controller.js"
import { validate } from "../middlewares/validate.js"

export const router = Router()
router.get("/health", (_req, res) => res.json({ ok: true }))
router.get("/export", c.exportAll)
router.get("/entries", c.list)
router.post("/entries", validate(c.entryBody), c.create)
router.patch("/entries/:id", validate(c.updateBody), c.update)
router.patch("/entries/:id/favorite", c.toggleFavorite)
router.delete("/entries/:id", c.remove)