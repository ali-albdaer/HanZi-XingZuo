import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DecksPage } from './pages/DecksPage';
import { DeckDetailPage } from './pages/DeckDetailPage';
import { PracticePage } from './pages/PracticePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/decks" replace />} />
          <Route path="decks" element={<DecksPage />} />
          <Route path="decks/:deckId" element={<DeckDetailPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
