import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Play } from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  return (
    <nav className="bottom-tab-bar">
      <NavLink
        to="/decks"
        className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
      >
        <BookOpen size={20} />
        <span>Decks</span>
      </NavLink>

      <NavLink
        to="/practice"
        className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
      >
        <Play size={20} />
        <span>Practice</span>
      </NavLink>
    </nav>
  );
};
