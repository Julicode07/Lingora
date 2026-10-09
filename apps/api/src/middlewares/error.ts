import type { ErrorRequestHandler, RequestHandler } from "express"

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)

export const notFound: RequestHandler = (_req, res) => res.status(404).json({ error: "Ruta no encontrada" })

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  const status = err.name === "CastError" ? 400 : 500
  res.status(status).json({ error: status === 400 ? "Id inválido" : "Error interno del servidor" })
}
