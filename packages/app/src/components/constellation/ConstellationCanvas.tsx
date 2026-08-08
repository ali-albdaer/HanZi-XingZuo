import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import type { MasteryLevel } from '../../config/app.config';
import { MASTERY_COLORS } from '../../config/app.config';
import { useDeckStore } from '../../stores/deckStore';
import * as d3 from 'd3';
import { Info, Compass } from 'lucide-react';

interface ConstellationCanvasProps {
  characters: CharacterWithProgress[];
  initialMode?: 'orbit' | 'showAll';
}

interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  pinyin: string;
  mastery: MasteryLevel;
  frequency: number;
  components: string[];
  radical: string;
  level: number; // 0 = center, 1 = direct, 2 = foggy outer
  x?: number;
  y?: number;
  targetX?: number;
  targetY?: number;
}

interface LinkData {
  source: string;
  target: string;
  level: number; // 1 = center to level 1, 2 = level 1 to level 2 or inter-neighbor
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({
  characters,
  initialMode = 'orbit',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);

  const [focusedCharId, setFocusedCharId] = useState<string>(characters[0]?.id || '我');

  // Camera Pan & Zoom state (Seamless Game Map Movement)
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);

  // Dragging state
  const isDraggingRef = useRef(false);
  const startDragRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  // Smooth slide animation state
  const slideAnimationRef = useRef<{
    animating: boolean;
    startPanX: number;
    startPanY: number;
    targetPanX: number;
    targetPanY: number;
    startTime: number;
  }>({
    animating: false,
    startPanX: 0,
    startPanY: 0,
    targetPanX: 0,
    targetPanY: 0,
    startTime: 0,
  });

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

  // Build 2-level Multi-hop Graph Structure for Orbit Mode
  const orbitGraph = useMemo(() => {
    if (!focusedChar) return { nodes: [], links: [] };

    const centerComps = new Set([...focusedChar.components, focusedChar.radical].filter(Boolean));

    // Level 1: Direct component/radical neighbors
    const level1 = characters.filter((c) => {
      if (c.id === focusedChar.id) return false;
      if (!activeFilters[c.progress.mastery]) return false;
      const cComps = [...c.components, c.radical].filter(Boolean);
      return cComps.some((comp) => centerComps.has(comp));
    }).slice(0, 10);

    // If level 1 is small, add nearby frequency chars
    if (level1.length < 6) {
      const extra = characters.filter(
        (c) => c.id !== focusedChar.id && activeFilters[c.progress.mastery] && !level1.includes(c)
      );
      level1.push(...extra.slice(0, 6 - level1.length));
    }

    const level1Ids = new Set(level1.map((c) => c.id));

    // Level 2: Foggy outer set (connected to Level 1 nodes)
    const level2Map = new Map<string, CharacterWithProgress>();
    const links: LinkData[] = [];

    // Center -> Level 1 links
    level1.forEach((l1) => {
      links.push({ source: focusedChar.id, target: l1.id, level: 1 });

      // Find Level 2 neighbors for this Level 1 node
      const l1Comps = new Set([...l1.components, l1.radical].filter(Boolean));
      const l2Candidates = characters.filter((c) => {
        if (c.id === focusedChar.id || level1Ids.has(c.id)) return false;
        if (!activeFilters[c.progress.mastery]) return false;
        const cComps = [...c.components, c.radical].filter(Boolean);
        return cComps.some((comp) => l1Comps.has(comp));
      }).slice(0, 2);

      l2Candidates.forEach((l2) => {
        level2Map.set(l2.id, l2);
        links.push({ source: l1.id, target: l2.id, level: 2 });
      });
    });

    // Inter-level1 links
    for (let i = 0; i < level1.length; i++) {
      for (let j = i + 1; j < level1.length; j++) {
        const aComps = new Set([...level1[i].components, level1[i].radical].filter(Boolean));
        const bComps = [...level1[j].components, level1[j].radical].filter(Boolean);
        if (bComps.some((c) => aComps.has(c))) {
          links.push({ source: level1[i].id, target: level1[j].id, level: 2 });
        }
      }
    }

    const nodes: NodeData[] = [
      {
        id: focusedChar.id,
        pinyin: focusedChar.pinyin[0],
        mastery: focusedChar.progress.mastery,
        frequency: focusedChar.frequency,
        components: focusedChar.components,
        radical: focusedChar.radical,
        level: 0,
      },
      ...level1.map((c) => ({
        id: c.id,
        pinyin: c.pinyin[0],
        mastery: c.progress.mastery,
        frequency: c.frequency,
        components: c.components,
        radical: c.radical,
        level: 1,
      })),
      ...Array.from(level2Map.values()).map((c) => ({
        id: c.id,
        pinyin: c.pinyin[0],
        mastery: c.progress.mastery,
        frequency: c.frequency,
        components: c.components,
        radical: c.radical,
        level: 2,
      })),
    ];

    return { nodes, links };
  }, [characters, focusedChar, activeFilters]);

  // Main Canvas Render Loop with Smooth Camera & D3 Force Positions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Position calculation for nodes
    const nodePosMap = new Map<string, { x: number; y: number; level: number; data: NodeData }>();

    if (initialMode === 'orbit') {
      // Center (Level 0)
      nodePosMap.set(focusedChar.id, {
        x: centerX,
        y: centerY,
        level: 0,
        data: orbitGraph.nodes[0],
      });

      // Level 1 nodes in inner circle (R1)
      const r1 = Math.min(width, height) * 0.28;
      const level1Nodes = orbitGraph.nodes.filter((n) => n.level === 1);
      const n1 = level1Nodes.length;

      level1Nodes.forEach((node, idx) => {
        const angle = (idx / n1) * 2 * Math.PI - Math.PI / 2;
        const nx = centerX + r1 * Math.cos(angle);
        const ny = centerY + r1 * Math.sin(angle);
        nodePosMap.set(node.id, { x: nx, y: ny, level: 1, data: node });
      });

      // Level 2 (Foggy Outer Set) in outer circle (R2) around their parent Level 1 node
      const r2 = Math.min(width, height) * 0.44;
      const level2Nodes = orbitGraph.nodes.filter((n) => n.level === 2);
      const n2 = level2Nodes.length;

      level2Nodes.forEach((node, idx) => {
        const angle = (idx / n2) * 2 * Math.PI - Math.PI / 4;
        const nx = centerX + r2 * Math.cos(angle);
        const ny = centerY + r2 * Math.sin(angle);
        nodePosMap.set(node.id, { x: nx, y: ny, level: 2, data: node });
      });
    }

    let rotationAngle = 0;

    const render = () => {
      // Smooth sliding animation for camera re-centering
      if (slideAnimationRef.current.animating) {
        const elapsed = Date.now() - slideAnimationRef.current.startTime;
        const duration = 350; // ms
        const progress = Math.min(1, elapsed / duration);
        // Cubic ease-out
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentX =
          slideAnimationRef.current.startPanX +
          (slideAnimationRef.current.targetPanX - slideAnimationRef.current.startPanX) * ease;
        const currentY =
          slideAnimationRef.current.startPanY +
          (slideAnimationRef.current.targetPanY - slideAnimationRef.current.startPanY) * ease;

        setPanX(currentX);
        setPanY(currentY);

        if (progress >= 1) {
          slideAnimationRef.current.animating = false;
        }
      }

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Apply Camera 2D Pan and Zoom Transform
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      rotationAngle += 0.0015;

      if (initialMode === 'orbit') {
        // Draw background space nebula orbits
        const r1 = Math.min(width, height) * 0.28;
        const r2 = Math.min(width, height) * 0.44;

        ctx.beginPath();
        ctx.arc(centerX, centerY, r1, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, r2, 0, 2 * Math.PI);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.stroke();
        ctx.setLineDash([]);

        // Render Links (Edges)
        orbitGraph.links.forEach((link) => {
          const srcId = typeof link.source === 'string' ? link.source : (link.source as NodeData).id;
          const tgtId = typeof link.target === 'string' ? link.target : (link.target as NodeData).id;

          const p1 = nodePosMap.get(srcId);
          const p2 = nodePosMap.get(tgtId);

          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            if (link.level === 1) {
              // Direct Center Link
              ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
              ctx.lineWidth = 2;
            } else {
              // Foggy Outer Link
              ctx.setLineDash([4, 4]);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.lineWidth = 1;
            }

            ctx.stroke();
            ctx.setLineDash([]);
          }
        });

        // Render Nodes
        nodePosMap.forEach((pos) => {
          const color = MASTERY_COLORS[pos.data.mastery];
          const isCenter = pos.level === 0;
          const isLevel2 = pos.level === 2;

          ctx.save();
          if (isLevel2) {
            ctx.globalAlpha = 0.55; // Foggy outer atmosphere
          }

          // Node Circle
          const r = isCenter ? 34 : isLevel2 ? 18 : 22;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = isCenter ? 'rgba(20, 24, 38, 0.95)' : 'rgba(15, 18, 28, 0.85)';
          ctx.fill();

          ctx.strokeStyle = color;
          ctx.lineWidth = isCenter ? 3.5 : 2;
          ctx.stroke();

          // Node Chinese Character
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${isCenter ? '700 28px' : isLevel2 ? '500 15px' : '600 18px'} Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pos.data.id, pos.x, pos.y - (isLevel2 ? 1 : 2));

          // Pinyin Label
          if (!isLevel2 || scale >= 0.8) {
            ctx.fillStyle = 'var(--accent-cyan)';
            ctx.font = `${isCenter ? '600 12px' : '500 10px'} Inter, sans-serif`;
            ctx.fillText(pos.data.pinyin, pos.x, pos.y + (isCenter ? 18 : 13));
          }

          ctx.restore();
        });
      } else {
        // Show All Mode (Full Deck Simulation Graph)
        const visibleChars = characters.filter((c) => activeFilters[c.progress.mastery]);

        // Draw simplified grid / force nodes
        const cols = Math.ceil(Math.sqrt(visibleChars.length));
        const spacing = 80;

        visibleChars.forEach((c, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const nx = (col - cols / 2) * spacing + centerX;
          const ny = (row - cols / 2) * spacing + centerY;

          const color = MASTERY_COLORS[c.progress.mastery];

          ctx.beginPath();
          ctx.arc(nx, ny, 16, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(15, 18, 28, 0.85)';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '600 14px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(c.id, nx, ny - 1);

          if (scale >= 0.9) {
            ctx.fillStyle = 'var(--accent-cyan)';
            ctx.font = '500 9px Inter, sans-serif';
            ctx.fillText(c.pinyin[0], nx, ny + 11);
          }
        });
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [initialMode, focusedChar, orbitGraph, activeFilters, panX, panY, scale]);

  // Pointer / Touch Handlers for Game Map Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startDragRef.current.x;
    const dy = e.clientY - startDragRef.current.y;
    setPanX(startDragRef.current.panX + dx / scale);
    setPanY(startDragRef.current.panY + dy / scale);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const totalDragDistance = Math.hypot(
      e.clientX - startDragRef.current.x,
      e.clientY - startDragRef.current.y
    );

    isDraggingRef.current = false;

    // If pointer click without dragging -> handle node selection & smooth slide
    if (totalDragDistance < 6) {
      handleCanvasClick(e);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(2.5, Math.max(0.4, scale * zoomFactor));
    setScale(newScale);
  };

  // Node Selection & Smooth Sliding Transition
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

    // Transform click coords into Canvas world space
    const worldX = (clickX - (width / 2 + panX)) / scale + width / 2;
    const worldY = (clickY - (height / 2 + panY)) / scale + height / 2;

    if (initialMode === 'orbit') {
      // Check center node tap -> open detail modal
      if (Math.hypot(worldX - centerX, worldY - centerY) <= 35 && focusedChar) {
        setSelectedCharacter(focusedChar);
        return;
      }

      // Check satellite node tap -> trigger smooth slide animation
      const r1 = Math.min(width, height) * 0.28;
      const level1Nodes = orbitGraph.nodes.filter((n) => n.level === 1);
      const n1 = level1Nodes.length;

      for (let idx = 0; idx < n1; idx++) {
        const node = level1Nodes[idx];
        const angle = (idx / n1) * 2 * Math.PI - Math.PI / 2;
        const nx = centerX + r1 * Math.cos(angle);
        const ny = centerY + r1 * Math.sin(angle);

        if (Math.hypot(worldX - nx, worldY - ny) <= 26) {
          // Trigger smooth slide animation to center chosen character!
          const deltaX = centerX - nx;
          const deltaY = centerY - ny;

          slideAnimationRef.current = {
            animating: true,
            startPanX: panX,
            startPanY: panY,
            targetPanX: panX + deltaX,
            targetPanY: panY + deltaY,
            startTime: Date.now(),
          };

          setFocusedCharId(node.id);
          return;
        }
      }

      // Check Level 2 foggy nodes
      const r2 = Math.min(width, height) * 0.44;
      const level2Nodes = orbitGraph.nodes.filter((n) => n.level === 2);
      const n2 = level2Nodes.length;

      for (let idx = 0; idx < n2; idx++) {
        const node = level2Nodes[idx];
        const angle = (idx / n2) * 2 * Math.PI - Math.PI / 4;
        const nx = centerX + r2 * Math.cos(angle);
        const ny = centerY + r2 * Math.sin(angle);

        if (Math.hypot(worldX - nx, worldY - ny) <= 22) {
          const deltaX = centerX - nx;
          const deltaY = centerY - ny;

          slideAnimationRef.current = {
            animating: true,
            startPanX: panX,
            startPanY: panY,
            targetPanX: panX + deltaX,
            targetPanY: panY + deltaY,
            startTime: Date.now(),
          };

          setFocusedCharId(node.id);
          return;
        }
      }
    }
  };

  const handleResetCamera = () => {
    setPanX(0);
    setPanY(0);
    setScale(1);
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
        width: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-main)',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {/* Floating Info & Reset Camera Controls */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={handleResetCamera}
          title="Center Map Camera"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 10,
            background: 'rgba(15, 18, 28, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Compass size={14} color="var(--accent-cyan)" />
          <span>Center</span>
        </button>

        {focusedChar && (
          <button
            onClick={() => setSelectedCharacter(focusedChar)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 10,
              background: 'rgba(15, 18, 28, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Info size={14} color="var(--accent-cyan)" />
            <span>Detail ({focusedChar.id})</span>
          </button>
        )}
      </div>

      {/* Mastery Filter Footer Bar */}
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

      {/* Main Map Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      />
    </div>
  );
};
