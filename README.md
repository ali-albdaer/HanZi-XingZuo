# HanZi XingZuo (汉字星座)

A modern, SRS-powered Chinese character learning and sentence practice web application.

## Features

- **Frequency-Based Learning**: Top 1,000 Chinese characters sourced from SUBTLEX-CH frequency data (HSK 1–9).
- **Interactive Practice Modes**: Sentence Magnet word assembly, Cloze exercises (multiple choice & keyboard input), and character recall cards.
- **Spaced Repetition System (SRS)**: Automatic mastery tracking (Grey → Bronze → Silver → Gold) with dynamic decay and targeted wrong-answer repetition.
- **Custom Reading Mining**: Import any raw Chinese text to automatically generate custom decks with pinyin, definitions, and segmented sentence exercises.
- **Responsive Views**: Grid, List, and Orbit views with customizable display filters (Pinyin, Rank, HSK, Known status).

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