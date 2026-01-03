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
  await bootstrap();
  app.listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
};

start().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
