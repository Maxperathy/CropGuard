# CropGuard GH 🌿

CropGuard GH is a premium, state-of-the-art agricultural web application designed for smallholder farmers in Ghana. It integrates advanced machine learning models for real-time crop disease diagnosis, interactive AI-powered agronomic advising, regional weather risk alerts, and local geolocated agro-dealer recommendations.

The interface is inspired by high-end design systems (Linear, Apple Human Interface, Vercel, and Stripe) featuring curated layouts, micro-animations, dynamic dashboard stats, and full responsiveness.

---

## Key Features

1. **🌿 Real-time Crop Disease Diagnosis**
   - Upload clear images of leaves or crop parts to immediately detect plant pathological anomalies using vision models.
   - Dynamic scanning checklist animates real-time verification progress.
   - Visual diagnosis card returns confidence metrics, disease names (and their scientific taxonomies), and custom preventative care guidelines.

2. **💬 Contextual AI Assistant**
   - Directly follow-up and ask contextual treatment questions below your scan results.
   - Text-only conversation driven by Llama models for agronomic and agricultural guidance.

3. **🌤️ Local Weather & Outbreak Risk**
   - Real-time weather data fetched automatically based on the user's browser geolocation coordinates using Open-Meteo API.
   - Automatic reverse geocoding via OpenStreetMap's Nominatim API to show local town/village names.
   - Dynamic disease outbreak spread alerts computed from current relative humidity values.

4. **📍 Geolocated Agro-Dealers Map**
   - Interactive local supply center markers rendered on a custom Leaflet-driven map.
   - Accepts browser coordinates to calculate distances using the Haversine formula, sorting nearby agro-dealers from closest to furthest.

5. **📊 Dynamic Farmer Dashboard**
   - Unified metrics displaying **Total Scans**, **AI Accuracy**, **Farmer Reputation Points** (retrieved from Neon PostgreSQL), and **Current Streak** (derived dynamically from consecutive daily scans).
   - Real-time page-level sync updates stats instantly if logs are deleted from the database.

6. **📜 Scan History Log**
   - Retrieve all past diagnoses from the PostgreSQL database in a clean, chronologically organized list with confidence meters and severity indicators.
   - Built-in instant deletion button with smooth toast notification feedback.

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Framer Motion (for fluid animations) + Leaflet (Map services).
- **Backend**: Node.js + Express + TypeScript + PostgreSQL (Neon Database) + Multer.
- **AI Engine**: Groq Cloud Gateway (Meta Llama 4 Scout 17B Instruct for vision and Llama 3.3 70B for agent dialog).

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database Instance (or Neon connection string)
- Groq Cloud API Key

### Configuration
1. **Server Setup**:
   Create a `.env` file inside the `server/` directory:
   ```env
   DATABASE_URL=postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require
   PORT=4000
   USE_GROQ=true
   GROQ_API_KEY=your_groq_api_key
   GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
   GROQ_CHAT_MODEL=llama-3.3-70b-versatile
   ```

2. **Client Setup**:
   Create a `.env` file inside the `client/` directory:
   ```env
   VITE_API_URL=http://localhost:4000/api
   ```

### Execution
Run the backend server:
```bash
cd server
npm install
npm run dev
```

Run the frontend client:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` to interact with the application.
