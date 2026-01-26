# AI Model Release Tracker

A professional 3D globe visualization tracking AI model releases worldwide. Built with React, react-globe.gl, Three.js, and Tailwind CSS.

## Features

- **Interactive 3D Globe** with dark theme and cyan accents
- **Company HQ markers** with pulsing glow effects
- **Animated connection arcs** between AI companies and research centers
- **Model release markers** plotted geographically
- **Layer controls** to toggle visibility of different data layers
- **Company legend** with click-to-filter
- **Live updates feed** with auto-scrolling news ticker
- **AI insights cards** with rotating statistics
- **Detail panels** that slide in when clicking markers
- **Benchmark visualizations** with progress bars
- **Glassmorphism UI** with backdrop blur effects
- **Smooth auto-rotation** with mouse drag/scroll controls

## Tech Stack

- **React 19** + **Vite**
- **react-globe.gl** - WebGL globe visualization
- **Three.js** - 3D rendering engine
- **Tailwind CSS v4** - Utility-first styling

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Deploy automatically (config included in `vercel.json`)

Or use the CLI:

```bash
npx vercel
```

### Manual

```bash
npm run build
# Serve the `dist/` directory with any static file server
```

## Project Structure

```
src/
  components/
    GlobeVisualization.jsx  - 3D globe with markers, arcs, and rings
    TopBar.jsx              - Header with logo and actions
    LeftSidebar.jsx         - Layer toggles and company legend
    BottomPanels.jsx        - Live updates feed and insights cards
    ModelDetailPanel.jsx    - Slide-in detail panel for models/companies
  data/
    mockData.js             - AI companies, models, connections, updates
  App.jsx                   - Main application shell
  index.css                 - Global styles and Tailwind imports
  main.jsx                  - Entry point
```

## Data

The tracker includes mock data for 9 AI companies and 20 model releases spanning 2024-2025, including GPT-4o, Claude Sonnet 4, Gemini 2.5 Pro, Llama 4, and more.
