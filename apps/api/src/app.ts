import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { env } from "./config/env.js"
import { connectDB } from "./config/db.js"
import { router } from "./routes/index.js"
import { errorHandler, notFound } from "./middlewares/error.js"

export const app = express()

app.set("trust proxy", 1)
app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json())
if (env.NODE_ENV !== "test") app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"))

// Conecta a Mongo antes de cada ruta (la conexión se reutiliza gracias a la caché de db.ts).
app.use("/api", async (_req, _res, next) => {
    try {
        await connectDB()
        next()
    } catch (e) {
        next(e)
    }
})

app.use("/api", router)
app.use(notFound)
app.use(errorHandler)

export default app // 👈 lo que Vercel necesita