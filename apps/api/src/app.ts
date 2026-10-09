import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { env } from "./config/env.js"
import { router } from "./routes/index.js"
import { errorHandler, notFound } from "./middlewares/error.js"

export const app = express()

app.set("trust proxy", 1)
app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json())
if (env.NODE_ENV !== "test") app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"))
app.use("/api", router)
app.use(notFound)
app.use(errorHandler)