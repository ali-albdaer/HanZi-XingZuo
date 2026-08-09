import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { CharacterWithProgress } from '../../db/queries';
import type { MasteryLevel } from '../../config/app.config';
import { MASTERY_COLORS } from '../../config/app.config';
import { useDeckStore } from '../../stores/deckStore';
import { Info, Compass } from 'lucide-react';

interface ConstellationCanvasProps {
  characters: CharacterWithProgress[];
  initialMode?: 'orbit' | 'showAll';
}

interface ConstellationNode {
  id: string;
  pinyin: string;
  mastery: MasteryLevel;
  frequency: number;
  components: string[];
  radical: string;
  level: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  oscPhaseX: number;
  oscPhaseY: number;
  oscSpeed: number;
  alpha: number;
}

interface ConstellationLink {
  source: string;
  target: string;
  level: number;
}

const MAX_OSCILLATION_PX = 5.0;

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({
  characters,
  initialMode = 'orbit',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setSelectedCharacter = useDeckStore((s) => s.setSelectedCharacter);
  const setViewMode = useDeckStore((s) => s.setViewMode);

  const [focusedCharId, setFocusedCharId] = useState<string>(characters[0]?.id || '我');

  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scaleRef = useRef<number>(1);
  const isDraggingRef = useRef(false);
  const startDragRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });

  const [activeFilters, setActiveFilters] = useState<Record<MasteryLevel, boolean>>({
    grey: true, bronze: true, silver: true, gold: true,
  });

  const focusedChar = useMemo(() => {
    return characters.find((c) => c.id === focusedCharId) || characters[0];
  }, [characters, focusedCharId]);

  // Graph Data for Orbit
  const graphData = useMemo(() => {
    if (!focusedChar) return { rawNodes: [], links: [] };

    const centerComps = new Set([...focusedChar.components, focusedChar.radical].filter(Boolean));

    const primary = characters.filter((c) => {
      if (c.id === focusedChar.id) return false;
      if (!activeFilters[c.progress.mastery]) return false;
      const cComps = [...c.components, c.radical].filter(Boolean);
      return cComps.some((comp) => centerComps.has(comp));
    }).slice(0, 10);

    if (primary.length < 6) {
      const extra = characters.filter(
        (c) => c.id !== focusedChar.id && activeFilters[c.progress.mastery] && !primary.includes(c)
      );
      primary.push(...extra.slice(0, 6 - primary.length));
    }

    const primaryIds = new Set(primary.map((c) => c.id));
    const secondaryMap = new Map<string, CharacterWithProgress>();
    const links: ConstellationLink[] = [];

    primary.forEach((p) => {
      links.push({ source: focusedChar.id, target: p.id, level: 1 });
      const pComps = new Set([...p.components, p.radical].filter(Boolean));
      const sCandidates = characters.filter((c) => {
        if (c.id === focusedChar.id || primaryIds.has(c.id)) return false;
        if (!activeFilters[c.progress.mastery]) return false;
        const cComps = [...c.components, c.radical].filter(Boolean);
        return cComps.some((comp) => pComps.has(comp));
      }).slice(0, 2);

      sCandidates.forEach((s) => {
        secondaryMap.set(s.id, s);
        links.push({ source: p.id, target: s.id, level: 2 });
      });
    });

    for (let i = 0; i < primary.length; i++) {
      for (let j = i + 1; j < primary.length; j++) {
        const aComps = new Set([...primary[i].components, primary[i].radical].filter(Boolean));
        const bComps = [...primary[j].components, primary[j].radical].filter(Boolean);
        if (bComps.some((c) => aComps.has(c))) {
          links.push({ source: primary[i].id, target: primary[j].id, level: 2 });
        }
      }
    }

    const rawNodes = [
      { char: focusedChar, level: 0 },
      ...primary.map((c) => ({ char: c, level: 1 })),
      ...Array.from(secondaryMap.values()).map((c) => ({ char: c, level: 2 })),
    ];

    return { rawNodes, links };
  }, [characters, focusedChar, activeFilters]);

  // Cluster Data for Show All
  const clusterData = useMemo(() => {
    if (initialMode !== 'showAll') return { nodes: [] };
    const visibleChars = characters.filter((c) => activeFilters[c.progress.mastery]);
    
    // Group by HSK Level (1 to 6+)
    const clusters: Record<string, CharacterWithProgress[]> = {};
    visibleChars.forEach(c => {
      const hsk = c.hskLevel || '1';
      const key = hsk.includes('-') ? '7' : hsk; // Group 7-9 as 7
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(c);
    });

    // 2D Cluster Layout
    // Arrange clusters in a circle
    const clusterKeys = Object.keys(clusters).sort();
    const clusterNodes: any[] = [];
    
    // Layout parameters
    const CLUSTER_RADIUS = 350;
    const NODE_SPACING = 35;

    clusterKeys.forEach((key, i) => {
      const angle = (i / clusterKeys.length) * 2 * Math.PI - Math.PI / 2;
      const cx = CLUSTER_RADIUS * Math.cos(angle);
      const cy = CLUSTER_RADIUS * Math.sin(angle);
      
      const chars = clusters[key];
      // Arrange chars in a grid within cluster
      const cols = Math.ceil(Math.sqrt(chars.length));
      
      chars.forEach((c, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const xOffset = (col - cols/2) * NODE_SPACING;
        const yOffset = (row - cols/2) * NODE_SPACING;
        
        clusterNodes.push({
          char: c,
          x: cx + xOffset,
          y: cy + yOffset,
          hsk: key
        });
      });
    });

    return { nodes: clusterNodes };
  }, [characters, activeFilters, initialMode]);

  const nodesRef = useRef<Map<string, ConstellationNode>>(new Map());
  const animRef = useRef({ startTime: 0, animating: false, sourceMap: new Map<string, ConstellationNode>() });

  // Update layout when graphData or initialMode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    const sourceMap = new Map(nodesRef.current);
    const newNodes = new Map<string, ConstellationNode>();

    if (initialMode === 'orbit') {
      const r1 = Math.min(width, height) * 0.28;
      const r2 = Math.min(width, height) * 0.44;

      const primaryNodes = graphData.rawNodes.filter((n) => n.level === 1);
      const secondaryNodes = graphData.rawNodes.filter((n) => n.level === 2);
      
      graphData.rawNodes.forEach((item) => {
        let bx = centerX, by = centerY;
        if (item.level === 1) {
          const idx = primaryNodes.indexOf(item);
          const angle = (idx / primaryNodes.length) * 2 * Math.PI - Math.PI / 2;
          bx = centerX + r1 * Math.cos(angle);
          by = centerY + r1 * Math.sin(angle);
        } else if (item.level === 2) {
          const idx = secondaryNodes.indexOf(item);
          const angle = (idx / secondaryNodes.length) * 2 * Math.PI - Math.PI / 4;
          bx = centerX + r2 * Math.cos(angle);
          by = centerY + r2 * Math.sin(angle);
        }

        const existing = sourceMap.get(item.char.id);
        newNodes.set(item.char.id, {
          id: item.char.id,
          pinyin: item.char.pinyin[0],
          mastery: item.char.progress.mastery,
          frequency: item.char.frequency,
          components: item.char.components,
          radical: item.char.radical,
          level: item.level,
          baseX: bx,
          baseY: by,
          x: existing ? existing.x : centerX, // animate from center if new
          y: existing ? existing.y : centerY,
          oscPhaseX: existing ? existing.oscPhaseX : Math.random() * Math.PI * 2,
          oscPhaseY: existing ? existing.oscPhaseY : Math.random() * Math.PI * 2,
          oscSpeed: item.level === 0 ? 0.5 : item.level === 1 ? 0.45 : 0.4,
          alpha: item.level === 2 ? 0.5 : 1,
        });
      });
    } else {
      clusterData.nodes.forEach((item) => {
        const bx = centerX + item.x;
        const by = centerY + item.y;
        const existing = sourceMap.get(item.char.id);
        newNodes.set(item.char.id, {
          id: item.char.id,
          pinyin: item.char.pinyin[0],
          mastery: item.char.progress.mastery,
          frequency: item.char.frequency,
          components: item.char.components,
          radical: item.char.radical,
          level: 3, // Cluster level
          baseX: bx,
          baseY: by,
          x: existing ? existing.x : bx,
          y: existing ? existing.y : by,
          oscPhaseX: 0,
          oscPhaseY: 0,
          oscSpeed: 0,
          alpha: 1,
        });
      });
    }

    nodesRef.current = newNodes;
    animRef.current = { startTime: Date.now(), animating: true, sourceMap };

  }, [graphData, clusterData, initialMode]);

  // Main Render Loop
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

    const accentCyan = getComputedStyle(document.documentElement).getPropertyValue('--accent-cyan').trim() || '#18e7ec';

    const render = () => {
      const timeSec = Date.now() * 0.001;
      const currentPan = panRef.current;
      const currentScale = scaleRef.current;

      let ease = 1;
      if (animRef.current.animating) {
        const elapsed = Date.now() - animRef.current.startTime;
        const progress = Math.min(1, elapsed / 450);
        ease = 1 - Math.pow(1 - progress, 3);
        if (progress >= 1) animRef.current.animating = false;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2 + currentPan.x, height / 2 + currentPan.y);
      ctx.scale(currentScale, currentScale);
      ctx.translate(-width / 2, -height / 2);

      const nodes = nodesRef.current;
      const sourceMap = animRef.current.sourceMap;

      nodes.forEach((node) => {
        const src = sourceMap.get(node.id);
        const startX = src ? src.x : centerX;
        const startY = src ? src.y : centerY;
        
        let targetX = node.baseX;
        let targetY = node.baseY;

        if (initialMode === 'orbit') {
          targetX += MAX_OSCILLATION_PX * Math.sin(node.oscSpeed * timeSec + node.oscPhaseX);
          targetY += MAX_OSCILLATION_PX * Math.cos(node.oscSpeed * timeSec * 0.8 + node.oscPhaseY);
        }

        node.x = startX + (targetX - startX) * ease;
        node.y = startY + (targetY - startY) * ease;
      });

      if (initialMode === 'orbit') {
        const r1 = Math.min(width, height) * 0.28;
        const r2 = Math.min(width, height) * 0.44;

        ctx.beginPath();
        ctx.arc(centerX, centerY, r1, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.14)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, r2, 0, 2 * Math.PI);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        graphData.links.forEach((link) => {
          const n1 = nodes.get(link.source);
          const n2 = nodes.get(link.target);
          if (n1 && n2) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            if (link.level === 1) {
              ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
              ctx.lineWidth = 2.2;
            } else {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
              ctx.lineWidth = 1.2;
              ctx.setLineDash([4, 4]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }

      nodes.forEach((node) => {
        const color = MASTERY_COLORS[node.mastery];
        const isCenter = node.level === 0;
        const isSecondary = node.level === 2;
        const isCluster = node.level === 3;

        ctx.save();
        ctx.globalAlpha = node.alpha;

        const radius = isCenter ? 36 : isSecondary ? 18 : isCluster ? 14 : 23;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isCenter ? 'rgba(20, 26, 42, 0.95)' : 'rgba(15, 18, 28, 0.9)';
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = isCenter ? 3.5 : isCluster ? 1 : 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${isCenter ? '700 28px' : isSecondary ? '500 15px' : isCluster ? '500 12px' : '600 18px'} Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y - (isSecondary || isCluster ? 1 : 2));

        if (!isSecondary && !isCluster || currentScale >= 0.85) {
          ctx.fillStyle = accentCyan;
          ctx.font = `${isCenter ? '600 12px' : '500 10px'} Inter, sans-serif`;
          if (!isCluster) {
            ctx.fillText(node.pinyin, node.x, node.y + (isCenter ? 18 : 13));
          }
        }

        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [initialMode, graphData, clusterData]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startDragRef.current.x;
    const dy = e.clientY - startDragRef.current.y;
    panRef.current = {
      x: startDragRef.current.panX + dx / scaleRef.current,
      y: startDragRef.current.panY + dy / scaleRef.current,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const dist = Math.hypot(e.clientX - startDragRef.current.x, e.clientY - startDragRef.current.y);
    isDraggingRef.current = false;
    if (dist < 6) handleCanvasClick(e);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    scaleRef.current = Math.min(initialMode === 'showAll' ? 3.0 : 2.5, Math.max(0.2, scaleRef.current * zoomFactor));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    const worldX = (clickX - (width / 2 + panRef.current.x)) / scaleRef.current + width / 2;
    const worldY = (clickY - (height / 2 + panRef.current.y)) / scaleRef.current + height / 2;

    const nodes = Array.from(nodesRef.current.values());
    
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = n.level === 0 ? 36 : n.level === 2 ? 18 : n.level === 3 ? 14 : 23;
      if (Math.hypot(worldX - n.x, worldY - n.y) <= r) {
        if (initialMode === 'orbit') {
          if (n.level === 0) {
             setSelectedCharacter(focusedChar);
          } else {
             setFocusedCharId(n.id);
          }
        } else {
           setFocusedCharId(n.id);
           setViewMode('orbit');
        }
        return;
      }
    }
  };

  const handleResetCamera = () => {
    panRef.current = { x: 0, y: 0 };
    scaleRef.current = initialMode === 'showAll' ? 0.6 : 1;
  };
  
  useEffect(() => {
    if (initialMode === 'showAll') {
      scaleRef.current = 0.6;
    } else {
      scaleRef.current = 1;
    }
    panRef.current = { x: 0, y: 0 };
  }, [initialMode]);

  const toggleFilter = (level: MasteryLevel) => {
    setActiveFilters((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', backgroundColor: 'var(--bg-main)', overflow: 'hidden', touchAction: 'none' }}>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }}>
        <button onClick={handleResetCamera} title="Center Camera" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: 'rgba(15, 18, 28, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Compass size={14} color="var(--accent-cyan)" />
          <span>Center</span>
        </button>
        {focusedChar && initialMode === 'orbit' && (
          <button onClick={() => setSelectedCharacter(focusedChar)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: 'rgba(15, 18, 28, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Info size={14} color="var(--accent-cyan)" />
            <span>Detail ({focusedChar.id})</span>
          </button>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: 12, right: 12, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 10 }}>
        {(['grey', 'bronze', 'silver', 'gold'] as MasteryLevel[]).map((level) => {
          const active = activeFilters[level];
          const color = MASTERY_COLORS[level];
          const labels: Record<MasteryLevel, string> = { grey: 'UNSEEN', bronze: 'NOVICE', silver: 'PROVEN', gold: 'MASTERED' };

          return (
            <button key={level} onClick={() => toggleFilter(level)} style={{ padding: '6px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, border: `1px solid ${active ? color : 'var(--border-color)'}`, background: active ? `${color}20` : 'rgba(255, 255, 255, 0.05)', color: active ? color : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s ease' }}>
              {labels[level]}
            </button>
          );
        })}
      </div>

      <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onWheel={handleWheel} style={{ width: '100%', height: '100%', cursor: isDraggingRef.current ? 'grabbing' : 'grab' }} />
    </div>
  );
};
