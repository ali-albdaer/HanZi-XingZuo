import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Play, Settings } from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  return (
    <nav className="bottom-tab-bar">
      <NavLink
        to="/decks"
        className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
      >
        <BookOpen size={22} />
        <span>Decks</span>
      </NavLink>

      <NavLink
        to="/practice"
        className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
      >
        <Play size={22} />
        <span>Practice</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
      >
        <Settings size={22} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
};
