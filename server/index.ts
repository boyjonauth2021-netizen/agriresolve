import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createRouter } from "./routes.js";
import { seedDefaultConversation } from "./storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5000;

seedDefaultConversation();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(createRouter());

if (process.env.NODE_ENV === "production") {
  const publicDir = path.join(__dirname, "../public");
  // Built frontend lives in dist/public after `npm run build`
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`AgriResolve server running on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      "Warning: OPENAI_API_KEY is not set. AI assistant will not work."
    );
  }
});
