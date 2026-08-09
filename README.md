# HanZi XingZuo (汉字星座)

A Chinese character learning and sentence practice web app.

## Features

- **Frequency-Based Learning**: Top 1000 Chinese characters sourced from [SUBTLEX-CH](https://crk.ling.cam.ac.uk/datasets/subtlexch/) data.
- **Practice Modes**: Sentence assembly and fill in the blanks with multiple choice & keyboard input.
- **Spaced Repetition System (SRS)**: Mastery tracking with dynamic decay and targeted wrong-answer repetition.
- **Custom Reading Mining**: Import any raw Chinese text to generate custom decks with pinyin, definitions, and segmented sentence exercises. (Under Development)
- **Display Modes**: Grid, List, and Orbit views with customizable display filters (Pinyin, Rank, HSK, Known status).

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **State Management**: Zustand
- **Database**: Dexie.js (IndexedDB)
- **Styling**: Vanilla CSS (Glassmorphism design system)

## Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

## AI Usage

Developed with extensive assistance from AI agents, relying heavily on **Claude Opus 4.6** and **Gemini 3.6 Flash (High)**.
