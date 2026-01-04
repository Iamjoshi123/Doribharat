import express from "express";
import { env } from "./config/env.js";
import { protectWrites } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { bootstrap } from "./services/bootstrap.js";

const app = express();

app.use(express.json());
app.use("/auth", authRouter);
app.use(protectWrites);

app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

const start = async () => {
  try {
    // Perform database migrations and setup
    await bootstrap();

    // Cloud Run provides the port via the PORT environment variable
    // It is almost always 8080, but should never be hardcoded
    const port = Number(process.env.PORT) || env.port || 8080;

    // CRITICAL: You must listen on '0.0.0.0' for Cloud Run
    app.listen(port, "0.0.0.0", () => {
      console.log(`API listening on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error("Server failed to start due to an error:", error);
    // Exit with failure code so Cloud Run knows to retry or stop
    process.exit(1);
  }
};

start();
