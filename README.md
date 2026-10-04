# ReLoop — AI-Powered E-Waste Recycling & Smart Pickup Hub

> **Turn old devices into trusted value.** A production-grade, industrial-aesthetic circular economy web platform combining automated computer vision hardware diagnostics, real-time verified refiner bids in Erode, and carbon-optimized multi-stop doorstep collection.

---

## 🚀 Live Demo Quickstart (For Evaluators & Judges)

1. **Start the local server**:
   ```bash
   npm install
   npm run dev
   ```
2. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
3. **Recommended 2-Minute Demo Flow (End-to-End)**:
   - **Landing (`/`)**: View the animated hero scanning mockup, real-time platform impact counters, interactive value estimator, and CPCB compliance certifications.
   - **Scan (`/scan`)**: Choose any **1-Click Test Device** (e.g. *Lenovo ThinkPad T480* or *Apple iPhone 11*) or upload your own hardware photo. Watch the animated laser scan sweep and neural telemetry inspect the device, yielding condition Grade (A–D), detected flaws chips, and instant ₹ valuation.
   - **Recyclers (`/recyclers`)**: Compare 10 authorized recycling facilities across Erode on the CartoDB Dark Matter map. Notice how payout bids dynamically update based on your diagnosed device. Click **"Audits"** to inspect DoD 5220.22-M data destruction standards, then click **"Schedule Pickup"**.
   - **Pickup Planner (`/pickup`)**: Inspect the AI-optimized 3-stop nearest-neighbor collection route drawn on the Erode map with the **"Best Route"** badge. Click **"Confirm Smart Pickup Route"**, then click through the live status stepper (`Scheduled` ➔ `On the way` ➔ `Collected` ➔ `Paid`) to trigger celebration confetti and instant simulated UPI credit.
   - **Dashboard (`/dashboard`)**: Check your personal circular ledger, registered devices list with grades, monthly carbon abatement chart, and raw metallurgical composition (Gold, Copper, Aluminum, Rare Earth).

> 💡 **Offline / No-Internet Demo Mode**: If presenting without stable internet, click the **"Demo Mode"** toggle in the footer. It pre-populates realistic hardware assessment data and active Erode pickup loops instantly.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Details |
|---|---|---|
| **Core Framework** | React 19 + TypeScript + Vite | Blazing fast HMR, strict type-safety |
| **Styling** | Tailwind CSS | Custom dark canvas (`#0A0F0D`), emerald/lime gradients (`#34D399` to `#A3E635`), glassmorphism |
| **Mapping Engine** | Leaflet + CartoDB Dark Matter | Offline-bundled dark vector tiles, pulsing custom HTML markers, animated route polylines |
| **Animation & Micro-interactions** | Framer Motion + Canvas Confetti | Page reveals, laser sweep, number counters, and payout celebrations |
| **AI Diagnostics** | Swappable Service Layer | Google Gemini 1.5/2.0 Vision API with automatic fallback to realistic heuristic diagnostic engine |
| **State & Persistence** | React Context + LocalStorage | Seamless data handoff between Scan, Recyclers, Pickup, and Dashboard |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Optional: Google Gemini API Key for Live Computer Vision Analysis
# If omitted or offline, ReLoop automatically utilizes its built-in realistic diagnostic engine.
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🗺️ Erode Cluster Seed Data

Centered on **Erode Junction (`11.3410, 77.7172`)**, ReLoop includes 10 fictional but realistic CPCB-registered recycling facilities:

- **EcoCircuits GreenTek** — *Brough Road* (1.4 km) • PCB refining & same-day collection
- **Surampatti CleanTech Hub** — *Surampatti Four Roads* (2.1 km) • Battery neutralisation & rare earth recovery
- **Kasipalayam Urban Miners** — *Kasipalayam Industrial Estate* (3.6 km) • Zero-landfill certified dismantling
- **Chithode Mega Plant** — *NH 544 Salem-Kochi Highway* (9.8 km) • Automated PCB shredding & metallurgical smelter
- **Perundurai SIPCOT EcoPark** — *SIPCOT Growth Estate* (14.8 km) • Enterprise server & heavy electronic recovery
- **Bhavani RiverGreen Works** — *Kalingarayan Canal Rd, Bhavani* (12.3 km) • Gold & palladium hydrometallurgical refining
- **Veerappanchatram ChipRevive** — *Sathy Main Road* (2.8 km) • Component salvage & DoD data wiping
- **Solar Metal Recovery Station** — *Karur Bypass Road, Solar* (5.4 km) • Precious metal assay & instant UPI
- **Thindal GreenSphere** — *Thindal Hill Road* (4.9 km) • Residential & academic campus collection
- **Railway Colony Eco-Depot** — *Goods Shed Road* (0.9 km) • Express walk-in collection node

---

## 🧪 Verification & Build Status

Run the test build to ensure zero compile or runtime warnings:
```bash
npm run build
```
Build output:
`✓ built in ~1.9s` with zero TypeScript errors or missing imports.

---

## ⚠️ Known Notes & Limitations

1. **Map Tile Caching**: The interactive map uses CartoDB Dark Matter tiles. Leaflet CSS is bundled locally to eliminate external stylesheet delays.
2. **Simulated UPI Payments**: UPI payments and CPCB Form 6 PDF downloads are simulated client-side for demonstration safety; actual bank webhooks require enterprise banking gateway credentials.
3. **Camera Capture**: Mobile web browsers require HTTPS (or `localhost`) to access hardware camera streams; local file upload works unconditionally across all environments.

---

*ReLoop — Powering the clean circular hardware revolution in Tamil Nadu.*
