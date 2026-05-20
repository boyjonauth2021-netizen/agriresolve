# AgriResolve

**AgriResolve** is an AI-powered hydroponic crop advisor built for growers in Mauritius. Select from 19 vegetables and herbs, view ideal growing conditions (pH, EC, temperature, light), track estimated growth timelines, chat with the AI Green Assistant in English or Kreol, and simulate ESP32 sensor monitoring.

Originally built on [Replit](https://replit.com); this repository is a standalone version ready for GitHub and public deployment.

## Features

- **Plant library** — Aubergine, tomato, basil, bok choy, bitter gourd, and more
- **Growing guides** — pH, EC, air/water temperature, nutrients, and pro tips
- **Growth charts** — Height, pH, and EC projections over the harvest cycle
- **AI Green Assistant** — Streaming chat powered by OpenAI (English + Kreol voice input)
- **ESP32 monitor** — Apply settings and view simulated live sensor readings

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- An [OpenAI API key](https://platform.openai.com/api-keys) (for the AI assistant)

### Setup

```bash
git clone https://github.com/boyjonauth2021-netizen/agriresolve.git
cd agriresolve
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

- Frontend (Vite): port **5173**
- API server (Express): port **5000**

### Production build

```bash
npm run build
npm start
```

Serves the app at [http://localhost:5000](http://localhost:5000).

## Deploy to GitHub

1. Create a new repository on GitHub (e.g. `agriresolve`).
2. From this folder:

```bash
git init
git add .
git commit -m "Initial commit: AgriResolve hydroponic advisor"
git branch -M main
git remote add origin https://github.com/boyjonauth2021-netizen/agriresolve.git
git push -u origin main
```

3. For a **live public site**, deploy to one of these (all support Node.js + env vars):

| Platform | Notes |
|----------|--------|
| [Render](https://render.com) | Web Service, build: `npm install && npm run build`, start: `npm start` |
| [Railway](https://railway.app) | Add `OPENAI_API_KEY` in Variables |
| [Fly.io](https://fly.io) | Use a `Dockerfile` or Node buildpack |

Set `OPENAI_API_KEY` in the host’s environment variables. Do **not** commit `.env` to GitHub.

## Project structure

```
agri/
├── src/              # React frontend (Vite + Tailwind)
├── server/           # Express API
│   └── data/         # Plant database (JSON)
├── shared/           # TypeScript types
├── public/           # Icons, manifest
└── package.json
```

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/plants` | List all plants |
| `GET /api/plants/:id` | Plant details |
| `GET /api/plants/:id/growth-data` | Growth timeline data |
| `POST /api/esp32/apply/:plantId` | Apply settings (enables sensor simulation) |
| `GET /api/sensors/readings?plantId=` | Simulated sensor readings |
| `GET/POST /api/openai/conversations` | AI chat sessions |
| `POST /api/openai/conversations/:id/messages` | Stream chat (SSE) |
| `POST /api/openai/transcribe` | Voice-to-text (Whisper) |

## License

MIT — feel free to use and adapt for learning and community projects.

## Credits

Built with care for Mauritian growers. 🇲🇺
