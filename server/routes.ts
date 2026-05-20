import { Router } from "express";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Plant, PlantSummary } from "../shared/types.js";
import { generateGrowthData } from "./growth.js";
import { applyPlantSettings, getSensorReading } from "./sensors.js";
import * as storage from "./storage.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const plants: Plant[] = JSON.parse(
  readFileSync(join(__dirname, "data/plants.json"), "utf-8")
);

function getPlant(id: string): Plant | undefined {
  return plants.find((p) => p.id === id);
}

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const SYSTEM_PROMPT = `You are the AI Green Assistant for AgriResolve, a hydroponic crop advisor app designed for growers in Mauritius.

You help with:
- Hydroponic growing (DWC, NFT, Dutch Bucket, Kratky, Ebb & Flow)
- pH, EC, nutrients, temperature, and humidity management
- Tropical climate challenges (heat Nov–Mar, humidity, root rot prevention)
- Plant-specific advice for vegetables and herbs common in Mauritius

Respond in clear, practical language. Use markdown for formatting when helpful.
When the user writes in Mauritian Creole (Kreol Morisien), respond in Kreol unless they ask for English.
Keep answers focused and actionable for beginner to intermediate hydroponic growers.`;

export function createRouter(): Router {
  const router = Router();

  router.get("/api/plants", (_req, res) => {
    const summaries: PlantSummary[] = plants.map(
      ({ id, name, scientificName, category, emoji, growthDays }) => ({
        id,
        name,
        scientificName,
        category,
        emoji,
        growthDays,
      })
    );
    res.json(summaries);
  });

  router.get("/api/plants/:id", (req, res) => {
    const plant = getPlant(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });
    res.json(plant);
  });

  router.get("/api/plants/:id/growth-data", (req, res) => {
    const plant = getPlant(req.params.id);
    if (!plant) return res.status(404).json({ error: "Plant not found" });
    res.json(generateGrowthData(plant));
  });

  router.post("/api/esp32/apply/:plantId", (req, res) => {
    const plant = getPlant(req.params.plantId);
    if (!plant) return res.status(404).json({ error: "Plant not found" });
    applyPlantSettings(plant.id);
    res.json({
      success: true,
      plantId: plant.id,
      settings: {
        phMin: plant.conditions.phMin,
        phMax: plant.conditions.phMax,
        ecMin: plant.conditions.ecMin,
        ecMax: plant.conditions.ecMax,
        tempMin: plant.conditions.tempMin,
        tempMax: plant.conditions.tempMax,
        waterTempMin: plant.conditions.waterTempMin,
        waterTempMax: plant.conditions.waterTempMax,
        lightHoursPerDay: plant.conditions.lightHoursPerDay,
      },
    });
  });

  router.get("/api/sensors/readings", (req, res) => {
    const plantId = req.query.plantId as string;
    if (!plantId) {
      return res.status(400).json({ error: "plantId is required" });
    }
    const plant = getPlant(plantId);
    const reading = getSensorReading(plantId, plant);
    if (!reading) {
      return res
        .status(404)
        .json({ error: "No readings received yet for this plant" });
    }
    res.json(reading);
  });

  router.get("/api/openai/conversations", (_req, res) => {
    res.json(storage.listConversations());
  });

  router.post("/api/openai/conversations", (req, res) => {
    const title = req.body?.title || "New Conversation";
    res.json(storage.createConversation(title));
  });

  router.get("/api/openai/conversations/:id", (req, res) => {
    const id = Number(req.params.id);
    const conv = storage.getConversation(id);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    res.json({
      ...conv,
      messages: storage.getMessages(id),
    });
  });

  router.post("/api/openai/conversations/:id/messages", async (req, res) => {
    const id = Number(req.params.id);
    const conv = storage.getConversation(id);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const content = req.body?.content?.trim();
    if (!content) return res.status(400).json({ error: "content is required" });

    const openai = getOpenAI();
    if (!openai) {
      return res.status(503).json({
        error:
          "OpenAI API key not configured. Set OPENAI_API_KEY in your environment.",
      });
    }

    storage.addMessage(id, "user", content);
    const history = storage.getMessages(id);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    try {
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      storage.addMessage(id, "assistant", fullResponse);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      console.error("OpenAI error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to get AI response" });
      } else {
        res.write(
          `data: ${JSON.stringify({ content: "\n\n(Sorry, an error occurred.)" })}\n\n`
        );
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    }
  });

  router.post("/api/openai/transcribe", async (req, res) => {
    const openai = getOpenAI();
    if (!openai) {
      return res.status(503).json({
        error: "OpenAI API key not configured. Set OPENAI_API_KEY.",
      });
    }

    const { audio, mimeType, language } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "audio is required" });
    }

    try {
      const buffer = Buffer.from(audio, "base64");
      const ext = mimeType?.includes("mp4") ? "mp4" : "webm";
      const file = new File([buffer], `recording.${ext}`, {
        type: mimeType || "audio/webm",
      });

      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file,
        language: language || undefined,
      });

      res.json({ text: transcription.text });
    } catch (err) {
      console.error("Transcription error:", err);
      res.status(500).json({ error: "Transcription failed" });
    }
  });

  return router;
}
