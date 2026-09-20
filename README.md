# ⚡ ChargeFlow — EV Charging Intelligence & Trip Planner

A full-stack EV charging station locator, comparison, and intelligent trip-planning application.

![ChargeFlow](https://img.shields.io/badge/EV-Charging-green) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-purple)

## 🚀 Quick Start (2 minutes)

### Prerequisites
- **Node.js** v18+ → https://nodejs.org
- **VS Code** (recommended) → https://code.visualstudio.com

### Steps

```bash
# 1. Extract the ZIP file (or clone the repo)
# 2. Open terminal in the project folder
# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev

# 5. Open your browser
# Go to: http://localhost:3000
```

That's it! The app runs in **demo mode** — no API keys needed.

## 📁 Project Structure

```
chargeflow/
├── index.html                 # HTML entry point
├── package.json               # Dependencies & scripts
├── package-lock.json          # Locked dependency versions
├── tsconfig.json              # TypeScript configuration
├── vite.config.js             # Vite build configuration
├── .env.example               # Environment variables template
├── README.md                  # This file
│
├── public/                    # Static assets
│   ├── favicon.svg            # App favicon
│   ├── icon-192.png           # PWA icon (192x192)
│   ├── icon-512.png           # PWA icon (512x512)
│   └── manifest.json          # PWA manifest
│
└── src/                       # Source code
    ├── main.tsx               # App entry point
    ├── App.tsx                # Main routing
    ├── index.css              # Global styles + Tailwind
    ├── types.ts               # TypeScript type definitions
    │
    ├── components/            # Reusable UI components
    │   ├── Layout.tsx         # Navigation + responsive layout
    │   └── MapView.tsx        # MapLibre GL interactive map
    │
    ├── pages/                 # Page components
    │   ├── Home.tsx           # Landing page with hero
    │   ├── Explore.tsx        # Station finder + map
    │   ├── Planner.tsx        # Trip planner
    │   ├── Saved.tsx          # Saved stations
    │   ├── History.tsx        # Trip history
    │   └── Account.tsx        # Auth + vehicle profiles
    │
    └── lib/                   # Utility functions
        ├── calculations.ts    # EV math + algorithms
        ├── demoData.ts        # 15 demo charging stations
        ├── geocoding.ts       # Nominatim geocoding
        ├── routing.ts         # OSRM route calculation
        └── storage.ts         # localStorage persistence
```

## ✨ Features

### Core Features
- 🗺️ **Interactive Map** — MapLibre GL with OpenFreeMap tiles
- 🔍 **Location Search** — Real geocoding via Nominatim (OpenStreetMap)
- 📍 **Browser Geolocation** — Detect your current location
- 🛣️ **Route Calculation** — Real routing via OSRM
- 🔋 **EV Range Calculator** — Accurate range, energy, charging time, cost
- ⚡ **Charging Stop Recommendations** — Algorithmic scoring with transparent reasoning
- 🔧 **Station Filters** — Distance, connector, power, availability, hours
- 📊 **Station Comparison** — Compare up to 3 stations side-by-side
- 💾 **Saved Stations** — Bookmark favorites
- 📜 **Trip History** — Review past trips
- 👤 **User Profiles** — Auth + vehicle management
- 📱 **PWA Support** — Installable app shell
- 📱 **Mobile Responsive** — Works on all screen sizes

### Demo Stations (15 locations)
Stations around Chhatrapati Sambhajinagar (Aurangabad), Maharashtra, India:
- FastCharge Hub - CIDCO (120 kW)
- GreenCharge Station - Railway Station (60 kW)
- UltraCharge Mall (150 kW)
- EcoCharge Highway (50 kW)
- PowerUp Arena (25 kW)
- VoltStation University (80 kW)
- ChargePoint Express (180 kW)
- QuickCharge Plaza (60 kW)
- MegaCharge Station (350 kW)
- CityCharge Center (22 kW)
- HighwayCharge Ahmednagar (120 kW)
- PuneExpress Charger (150 kW)
- Pune Central Charge (100 kW)
- Nashik Highway Charge (60 kW)
- Mumbai Gateway Charger (200 kW)

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| Vite 6 | Build tool |
| Tailwind CSS 4 | Styling |
| MapLibre GL JS | Interactive maps |
| React Router 6 | Navigation |
| Lucide React | Icons |
| OpenFreeMap | Map tiles (free) |
| Nominatim | Geocoding (free) |
| OSRM | Routing (free) |

## 📋 Commands

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck
```

## 🌐 APIs Used (All Free, No Keys Required)

| API | Purpose | URL |
|-----|---------|-----|
| OpenFreeMap | Map tiles | tiles.openfreemap.org |
| Nominatim | Geocoding | nominatim.openstreetmap.org |
| OSRM | Routing | router.project-osrm.org |

## 🔧 Optional: Supabase Integration

For production with real authentication and database:

1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` to `.env.local`
3. Fill in your Supabase credentials
4. Create the database tables (profiles, vehicles, saved_stations, trips, trip_stops)

## 🚀 Deploy to Vercel

1. Push code to GitHub
2. Import in Vercel dashboard
3. Framework: Vite
4. Build: `npm run build`
5. Output: `dist`
6. Deploy!

## 📄 License

MIT License - Free for educational and commercial use.

## 🎓 Perfect For

- B.Tech engineering projects
- Portfolio demonstrations
- Learning modern web development
- EV mobility product prototypes

---

**Built with ❤️ for EV drivers everywhere**
