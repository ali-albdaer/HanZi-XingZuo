import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import type { MasteryLevel } from '../../config/app.config';
import { MASTERY_COLORS } from '../../config/app.config';
import { useDeckStore } from '../../stores/deckStore';
import * as d3 from 'd3';
import { Info } from 'lucide-react';

interface ConstellationCanvasProps {
  characters: CharacterWithProgress[];
}

interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  pinyin: string;
  mastery: MasteryLevel;
  frequency: number;
  components: string[];
  radical: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({ characters }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);

  const [viewMode, setViewMode] = useState<'orbit' | 'showAll'>('orbit');
  const [focusedCharId, setFocusedCharId] = useState<string>(characters[0]?.id || '我');

  // Mastery filters state
  const [activeFilters, setActiveFilters] = useState<Record<MasteryLevel, boolean>>({
    grey: true,
    bronze: true,
    silver: true,
    gold: true,
  });

  const focusedChar = useMemo(() => {
    return characters.find((c) => c.id === focusedCharId) || characters[0];
  }, [characters, focusedCharId]);

  // Find connected satellites for Orbit mode (sharing radical or components)
  const orbitSatellites = useMemo(() => {
    if (!focusedChar) return [];

    const fComps = new Set([...focusedChar.components, focusedChar.radical].filter(Boolean));

    const connected = characters.filter((c) => {
      if (c.id === focusedChar.id) return false;
      if (!activeFilters[c.progress.mastery]) return false;

      const cComps = [...c.components, c.radical].filter(Boolean);
      return cComps.some((comp) => fComps.has(comp));
    });

    // If connected pool is small, add nearby frequency characters
    if (connected.length < 8) {
      const remaining = characters.filter(
        (c) => c.id !== focusedChar.id && activeFilters[c.progress.mastery] && !connected.includes(c)
      );
      connected.push(...remaining.slice(0, 8 - connected.length));
    }

    return connected.slice(0, 12);
  }, [characters, focusedChar, activeFilters]);

  // Animation & Rendering Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotationAngle = 0;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    if (viewMode === 'orbit') {
      const renderOrbit = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.32;

        ctx.clearRect(0, 0, width, height);

        // Draw orbital background rings
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.stroke();

        rotationAngle += 0.002;

        // Render satellite nodes
        const numSatellites = orbitSatellites.length;
        const satellitePositions: { node: CharacterWithProgress; x: number; y: number }[] = [];

        orbitSatellites.forEach((sat, idx) => {
          const angle = rotationAngle + (idx / numSatellites) * 2 * Math.PI;
          const sx = centerX + radius * Math.cos(angle);
          const sy = centerY + radius * Math.sin(angle);
          satellitePositions.push({ node: sat, x: sx, y: sy });

          // Draw connector line to center
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Satellite node circle
          const nodeColor = MASTERY_COLORS[sat.progress.mastery];
          ctx.beginPath();
          ctx.arc(sx, sy, 22, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(15, 18, 28, 0.85)';
          ctx.fill();
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '600 18px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(sat.id, sx, sy - 2);

          // Pinyin
          ctx.fillStyle = 'var(--accent-cyan)';
          ctx.font = '500 10px Inter, sans-serif';
          ctx.fillText(sat.pinyin[0], sx, sy + 14);
        });

        // Render center node
        if (focusedChar) {
          const centerColor = MASTERY_COLORS[focusedChar.progress.mastery];

          // Center glow
          const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 50);
          grad.addColorStop(0, centerColor + '55');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
          ctx.fill();

          // Center circle
          ctx.beginPath();
          ctx.arc(centerX, centerY, 36, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(20, 24, 36, 0.95)';
          ctx.fill();
          ctx.strokeStyle = centerColor;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Center text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '700 30px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(focusedChar.id, centerX, centerY - 4);

          ctx.fillStyle = 'var(--accent-cyan)';
          ctx.font = '600 12px Inter, sans-serif';
          ctx.fillText(focusedChar.pinyin.join(', '), centerX, centerY + 20);
        }

        animationFrameId = requestAnimationFrame(renderOrbit);
      };

      renderOrbit();
    } else {
      // Force Simulation for Show All Mode
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      const nodesData: NodeData[] = characters
        .filter((c) => activeFilters[c.progress.mastery])
        .map((c) => ({
          id: c.id,
          pinyin: c.pinyin[0],
          mastery: c.progress.mastery,
          frequency: c.frequency,
          components: c.components,
          radical: c.radical,
        }));

      const simulation = d3
        .forceSimulation<NodeData>(nodesData)
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('charge', d3.forceManyBody().strength(-30))
        .force('collide', d3.forceCollide().radius(18));

      simulation.on('tick', () => {
        ctx.clearRect(0, 0, width, height);

        nodesData.forEach((node) => {
          if (!node.x || !node.y) return;
          const color = MASTERY_COLORS[node.mastery];

          ctx.beginPath();
          ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = color + '22';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '600 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.id, node.x, node.y);
        });
      });

      return () => {
        simulation.stop();
      };
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewMode, focusedChar, orbitSatellites, activeFilters]);

  // Click / Tap Handler for Node Selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    if (viewMode === 'orbit') {
      // Check if center node clicked -> open detail modal
      const distCenter = Math.hypot(clickX - centerX, clickY - centerY);
      if (distCenter <= 40 && focusedChar) {
        setSelectedCharacter(focusedChar);
        return;
      }

      // Check if any satellite clicked -> re-center on satellite
      const radius = Math.min(width, height) * 0.32;
      const numSatellites = orbitSatellites.length;

      for (let idx = 0; idx < numSatellites; idx++) {
        const sat = orbitSatellites[idx];
        const angle = (idx / numSatellites) * 2 * Math.PI; // base position
        const sx = centerX + radius * Math.cos(angle);
        const sy = centerY + radius * Math.sin(angle);

        if (Math.hypot(clickX - sx, clickY - sy) <= 30) {
          setFocusedCharId(sat.id);
          return;
        }
      }
    }
  };

  const toggleFilter = (level: MasteryLevel) => {
    setActiveFilters((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-main)',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar Controls */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* View Mode Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 18, 28, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: 3,
            border: '1px solid var(--border-color)',
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={() => setViewMode('orbit')}
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              border: 'none',
              background: viewMode === 'orbit' ? 'var(--accent-cyan)' : 'transparent',
              color: viewMode === 'orbit' ? '#000' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Orbit
          </button>

          <button
            onClick={() => setViewMode('showAll')}
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              border: 'none',
              background: viewMode === 'showAll' ? 'var(--accent-cyan)' : 'transparent',
              color: viewMode === 'showAll' ? '#000' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Show All
          </button>
        </div>

        {/* View Detail Button for Focused Character */}
        {focusedChar && (
          <button
            onClick={() => setSelectedCharacter(focusedChar)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 12,
              background: 'rgba(15, 18, 28, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            <Info size={14} color="var(--accent-cyan)" />
            <span>Detail ({focusedChar.id})</span>
          </button>
        )}
      </div>

      {/* Mastery Filter Bar Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          zIndex: 10,
        }}
      >
        {(['grey', 'bronze', 'silver', 'gold'] as MasteryLevel[]).map((level) => {
          const active = activeFilters[level];
          const color = MASTERY_COLORS[level];
          const labels: Record<MasteryLevel, string> = {
            grey: 'UNSEEN',
            bronze: 'NOVICE',
            silver: 'PROVEN',
            gold: 'MASTERED',
          };

          return (
            <button
              key={level}
              onClick={() => toggleFilter(level)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 8,
                border: `1px solid ${active ? color : 'var(--border-color)'}`,
                background: active ? `${color}22` : 'rgba(15, 18, 28, 0.85)',
                color: active ? color : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span>{labels[level]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
        }}
      />
    </div>
  );
};
