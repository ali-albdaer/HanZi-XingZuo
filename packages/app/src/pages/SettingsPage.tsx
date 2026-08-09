import React from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { Settings, Keyboard, MousePointer, Info, Sun, Moon, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const inputMode = useSettingsStore((s) => s.inputMode);
  const setInputMode = useSettingsStore((s) => s.setInputMode);

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const repetitionFrequency = useSettingsStore((s) => s.repetitionFrequency);
  const setRepetitionFrequency = useSettingsStore((s) => s.setRepetitionFrequency);

  const decayHours = useSettingsStore((s) => s.decayHours);
  const setDecayHours = useSettingsStore((s) => s.setDecayHours);

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-icon"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={22} style={{ color: 'var(--accent-cyan)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h1>
          </div>
        </div>
      </div>

      {/* Repetition Frequency & Spacing Preference */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          <RefreshCw size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Repetition Frequency (SRS Spacing)</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {(
            [
              { id: 'low', label: 'Low (Reduced)', desc: 'Focus on new words' },
              { id: 'balanced', label: 'Balanced', desc: 'Standard spacing' },
              { id: 'high', label: 'High', desc: 'Frequent reviews' },
            ] as const
          ).map((item) => {
            const isSelected = repetitionFrequency === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setRepetitionFrequency(item.id)}
                className={`btn btn-secondary ${isSelected ? 'active' : ''}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '12px 10px',
                  textAlign: 'center',
                }}
              >
                <span>{item.label}</span>
                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appearance Theme Selector (Dark Mode / Light Mode) */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>Appearance Theme</div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={() => setTheme('dark')}
            className={`btn btn-secondary ${theme === 'dark' ? 'active' : ''}`}
            style={{ flex: 1, padding: '10px 14px' }}
          >
            <Moon size={16} />
            <span>Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`btn btn-secondary ${theme === 'light' ? 'active' : ''}`}
            style={{ flex: 1, padding: '10px 14px' }}
          >
            <Sun size={16} />
            <span>Light Mode</span>
          </button>
        </div>
      </div>

      {/* Input Mode Preference */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>Default Cloze Input Mode</div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={() => setInputMode('selection')}
            className={`btn btn-secondary ${inputMode === 'selection' ? 'active' : ''}`}
            style={{ flex: 1, padding: '10px 14px' }}
          >
            <MousePointer size={16} />
            <span>Selection</span>
          </button>

          <button
            onClick={() => setInputMode('keyboard')}
            className={`btn btn-secondary ${inputMode === 'keyboard' ? 'active' : ''}`}
            style={{ flex: 1, padding: '10px 14px' }}
          >
            <Keyboard size={16} />
            <span>Keyboard</span>
          </button>
        </div>
      </div>

      {/* Decay Config */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          <Info size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>SRS Decay Configuration (Hours)</span>
        </div>

        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Gold → Silver (Default 720):</span>
            <input
              type="number"
              value={decayHours?.goldToSilver || 720}
              onChange={(e) => setDecayHours({ goldToSilver: Number(e.target.value) || 0 })}
              style={{ width: 80, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'right' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Silver → Bronze (Default 168):</span>
            <input
              type="number"
              value={decayHours?.silverToBronze || 168}
              onChange={(e) => setDecayHours({ silverToBronze: Number(e.target.value) || 0 })}
              style={{ width: 80, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'right' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Bronze → Grey (Default 48):</span>
            <input
              type="number"
              value={decayHours?.bronzeToGrey || 48}
              onChange={(e) => setDecayHours({ bronzeToGrey: Number(e.target.value) || 0 })}
              style={{ width: 80, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'right' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
