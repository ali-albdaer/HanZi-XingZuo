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
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/decks')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
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
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '10px 8px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: isSelected ? 'rgba(24, 231, 236, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
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
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: theme === 'dark' ? 'rgba(24, 231, 236, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: theme === 'dark' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: theme === 'dark' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <Moon size={16} />
            <span>Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme('light')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: theme === 'light' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: theme === 'light' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: theme === 'light' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
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
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: inputMode === 'selection' ? 'rgba(24, 231, 236, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: inputMode === 'selection' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: inputMode === 'selection' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <MousePointer size={16} />
            <span>Selection</span>
          </button>

          <button
            onClick={() => setInputMode('keyboard')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: inputMode === 'keyboard' ? 'rgba(24, 231, 236, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: inputMode === 'keyboard' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: inputMode === 'keyboard' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
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
