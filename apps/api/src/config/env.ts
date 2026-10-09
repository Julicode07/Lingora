import "dotenv/config"
import { z } from "zod"

const schema = z
  .object({
    PORT: z.coerce.number().default(3001),
    MONGODB_URI: z.string().optional(),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    NODE_ENV: z.string().default("development"),
  })
  .transform((v, ctx) => {
    const isProd = v.NODE_ENV === "production"
    if (isProd && !v.MONGODB_URI) {
      ctx.addIssue({ code: "custom", path: ["MONGODB_URI"], message: "Obligatoria en producción" })
      return z.NEVER
    }
    return { ...v, MONGODB_URI: v.MONGODB_URI ?? "mongodb://127.0.0.1:27017/lingora" }
  })

export const env = schema.parse(process.env)