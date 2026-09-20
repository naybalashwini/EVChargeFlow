# ⚡ ChargeFlow

**EV Charging Intelligence & Trip Planner**

A modern web application for finding EV charging stations, comparing options, and planning intelligent trips with charging stop recommendations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg)

## 🌟 Features

### Core Functionality
- **Interactive Map** - Real-time map with charging station markers using MapLibre GL JS
- **Location Search** - Search any location using OpenStreetMap Nominatim API
- **Geolocation** - Detect user's current location with browser API
- **Trip Planning** - Calculate routes using OSRM with charging stop recommendations
- **EV Range Calculator** - Calculate range based on battery capacity and consumption
- **Smart Filtering** - Filter stations by distance, connector type, power, availability
- **Station Comparison** - Compare up to 3 stations side-by-side
- **Saved Stations** - Bookmark favorite charging stations
- **Trip History** - View and manage past trip plans
- **Vehicle Profiles** - Manage multiple EV configurations
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **PWA Support** - Installable as a progressive web app

### Technical Highlights
- Real geocoding via OpenStreetMap Nominatim
- Real routing via OSRM (Open Source Routing Machine)
- Interactive maps with MapLibre GL JS
- Glassmorphism UI with dark theme
- TypeScript for type safety
- Modular architecture with clean separation of concerns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/chargeflow.git
cd chargeflow

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [https://ev-charge-flow.vercel.app/explore](https://ev-charge-flow-4vhuw7wf8-index-cebe.vercel.app) in your browser.

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript 5** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS 4** | Styling |
| **MapLibre GL JS** | Interactive maps |
| **React Router** | Navigation |
| **Lucide React** | Icons |
| **OpenStreetMap** | Geocoding & tiles |
| **OSRM** | Route calculation |

## 📁 Project Structure

```
chargeflow/
├── public/                 # Static assets
│   ├── favicon.svg
│   ├── icon-192.svg
│   ├── icon-512.svg
│   └── manifest.json
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout.tsx      # Navigation & layout
│   │   └── MapView.tsx     # MapLibre map component
│   ├── pages/              # Page components
│   │   ├── Home.tsx        # Landing page
│   │   ├── Explore.tsx     # Station finder
│   │   ├── Planner.tsx     # Trip planner
│   │   ├── Saved.tsx       # Saved stations
│   │   ├── History.tsx     # Trip history
│   │   └── Account.tsx     # User account
│   ├── lib/                # Utility functions
│   │   ├── calculations.ts # EV math & algorithms
│   │   ├── demoData.ts     # Demo station data
│   │   ├── geocoding.ts    # Location search
│   │   ├── routing.ts      # Route calculation
│   │   └── storage.ts      # LocalStorage persistence
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   ├── types.ts            # TypeScript types
│   └── index.css           # Global styles
├── index.html              # HTML template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.js          # Vite config
└── README.md               # This file
```

## 🗺️ Pages

### Home (`/`)
Landing page with hero section and quick access to main features.

### Explore (`/explore`)
Interactive map with charging station search, filters, and details.

### Trip Planner (`/planner`)
Plan EV trips with origin/destination, vehicle profile, and charging recommendations.

### Saved (`/saved`)
View and manage bookmarked charging stations.

### History (`/history`)
Review past trip plans with full details.

### Account (`/account`)
Manage user profile and vehicle configurations.

## 🔌 APIs Used

All APIs are free and require no authentication:

- **OpenStreetMap Nominatim** - Geocoding (location search)
- **OSRM** - Route calculation (driving directions)
- **OpenFreeMap** - Map tiles (MapLibre compatible)

## 📊 Demo Data

The app includes 15 demo charging stations around Chhatrapati Sambhajinagar (Aurangabad), Maharashtra, India for demonstration purposes. In production, these can be replaced with real API data.

## 🎨 Design

- **Theme**: Dark green/near-black with electric green accents
- **Style**: Glassmorphism cards with subtle borders
- **Typography**: Clean, modern, readable
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first design with adaptive layouts

## 🔧 Configuration

### Environment Variables

Create a `.env` file (optional):

```env
# Supabase (for production auth)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app works without any environment variables in demo mode.

## 📱 PWA Installation

The app can be installed as a PWA:

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Follow the installation prompts

## 🧪 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License

MIT License - feel free to use this project for learning, portfolio, or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 👨‍💻 Author

Built as a B.Tech engineering project demonstrating modern web development skills.

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [OSRM](http://project-osrm.org/) for routing
- [MapLibre](https://maplibre.org/) for map rendering
- [Lucide](https://lucide.dev/) for icons

---

**Made with ⚡ for EV drivers everywhere**
