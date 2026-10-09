import { app } from "./app.js"
import { connectDB } from "./config/db.js"
import { env } from "./config/env.js"

connectDB()
  .then(() => app.listen(env.PORT, () => console.log(`API en http://localhost:${env.PORT}`)))
  .catch((e) => {
    console.error("No se pudo conectar a MongoDB:", e.message)
    process.exit(1)
  })
