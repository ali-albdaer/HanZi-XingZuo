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
  level: number; // 0 = center, 1 = primary, 2 = secondary
  // Base coordinates
  baseX: number;
  baseY: number;
  // Current dynamic coordinates (base + oscillation)
  x: number;
  y: number;
  // Oscillation parameters
  oscPhaseX: number;
  oscPhaseY: number;
  oscSpeed: number;
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

  // Camera Pan & Zoom stored in Refs to decouple 60fps canvas dragging from React re-render lag
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scaleRef = useRef<number>(1);

  // 3D Globe Trackball Rotation Angles (Show All Mode)
  const globeRotRef = useRef<{ x: number; y: number }>({ x: 0.2, y: 0 });

  // Dragging state
  const isDraggingRef = useRef(false);
  const startDragRef = useRef<{ x: number; y: number; panX: number; panY: number; rotX: number; rotY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
    rotX: 0,
    rotY: 0,
  });

  // Smooth Node Swap Animation State
  const swapAnimRef = useRef<{
    animating: boolean;
    startTime: number;
    duration: number;
    oldCenterId: string;
    newCenterId: string;
    nodeStarts: Map<string, { x: number; y: number }>;
    nodeTargets: Map<string, { x: number; y: number }>;
  }>({
    animating: false,
    startTime: 0,
    duration: 450,
    oldCenterId: '',
    newCenterId: '',
    nodeStarts: new Map(),
    nodeTargets: new Map(),
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

  // Build Topology Graph for Focused Character
  const graphData = useMemo(() => {
    if (!focusedChar) return { rawNodes: [], links: [] };

    const centerComps = new Set([...focusedChar.components, focusedChar.radical].filter(Boolean));

    // Primary Nodes (Level 1): Direct component/radical neighbors
    const primary = characters.filter((c) => {
      if (c.id === focusedChar.id) return false;
      if (!activeFilters[c.progress.mastery]) return false;
      const cComps = [...c.components, c.radical].filter(Boolean);
      return cComps.some((comp) => centerComps.has(comp));
    }).slice(0, 10);

    // Fallback if primary count < 6
    if (primary.length < 6) {
      const extra = characters.filter(
        (c) => c.id !== focusedChar.id && activeFilters[c.progress.mastery] && !primary.includes(c)
      );
      primary.push(...extra.slice(0, 6 - primary.length));
    }

    const primaryIds = new Set(primary.map((c) => c.id));
    const secondaryMap = new Map<string, CharacterWithProgress>();
    const links: ConstellationLink[] = [];

    // Center -> Primary links
    primary.forEach((p) => {
      links.push({ source: focusedChar.id, target: p.id, level: 1 });

      // Secondary (Level 2) outer neighbors connected to Primary node
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

    // Inter-Primary links
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

  // Main 60fps Render Loop
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

    // Build static base position mapping for Orbit graph
    const nodesMap = new Map<string, ConstellationNode>();

    if (initialMode === 'orbit') {
      // Level 0 Center
      nodesMap.set(focusedChar.id, {
        id: focusedChar.id,
        pinyin: focusedChar.pinyin[0],
        mastery: focusedChar.progress.mastery,
        frequency: focusedChar.frequency,
        components: focusedChar.components,
        radical: focusedChar.radical,
        level: 0,
        baseX: centerX,
        baseY: centerY,
        x: centerX,
        y: centerY,
        oscPhaseX: Math.random() * Math.PI * 2,
        oscPhaseY: Math.random() * Math.PI * 2,
        oscSpeed: 0.5,
      });

      // Level 1 Primary Ring
      const r1 = Math.min(width, height) * 0.28;
      const primaryNodes = graphData.rawNodes.filter((n) => n.level === 1);
      const n1 = primaryNodes.length;

      primaryNodes.forEach((item, idx) => {
        const angle = (idx / n1) * 2 * Math.PI - Math.PI / 2;
        const bx = centerX + r1 * Math.cos(angle);
        const by = centerY + r1 * Math.sin(angle);

        nodesMap.set(item.char.id, {
          id: item.char.id,
          pinyin: item.char.pinyin[0],
          mastery: item.char.progress.mastery,
          frequency: item.char.frequency,
          components: item.char.components,
          radical: item.char.radical,
          level: 1,
          baseX: bx,
          baseY: by,
          x: bx,
          y: by,
          oscPhaseX: Math.random() * Math.PI * 2,
          oscPhaseY: Math.random() * Math.PI * 2,
          oscSpeed: 0.45,
        });
      });

      // Level 2 Secondary Foggy Outer Ring
      const r2 = Math.min(width, height) * 0.44;
      const secondaryNodes = graphData.rawNodes.filter((n) => n.level === 2);
      const n2 = secondaryNodes.length;

      secondaryNodes.forEach((item, idx) => {
        const angle = (idx / n2) * 2 * Math.PI - Math.PI / 4;
        const bx = centerX + r2 * Math.cos(angle);
        const by = centerY + r2 * Math.sin(angle);

        nodesMap.set(item.char.id, {
          id: item.char.id,
          pinyin: item.char.pinyin[0],
          mastery: item.char.progress.mastery,
          frequency: item.char.frequency,
          components: item.char.components,
          radical: item.char.radical,
          level: 2,
          baseX: bx,
          baseY: by,
          x: bx,
          y: by,
          oscPhaseX: Math.random() * Math.PI * 2,
          oscPhaseY: Math.random() * Math.PI * 2,
          oscSpeed: 0.4,
        });
      });
    }

    // 3D Fibonacci Sphere Nodes for Interactive Globe Mode (Show All)
    const globNodes: { id: string; pinyin: string; mastery: MasteryLevel; rx: number; ry: number; rz: number }[] = [];

    if (initialMode === 'showAll') {
      const visibleChars = characters.filter((c) => activeFilters[c.progress.mastery]);
      const radius = Math.min(width, height) * 0.36;

      const phi = (1 + Math.sqrt(5)) / 2;
      const total = visibleChars.length;

      visibleChars.forEach((c, i) => {
        const theta = (2 * Math.PI * i) / phi;
        const y = 1 - (i / (total - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        globNodes.push({
          id: c.id,
          pinyin: c.pinyin[0],
          mastery: c.progress.mastery,
          rx: x * radius,
          ry: y * radius,
          rz: z * radius,
        });
      });
    }

    const render = () => {
      const timeSec = Date.now() * 0.001;
      const currentPan = panRef.current;
      const currentScale = scaleRef.current;

      // Handle Smooth Swap Animation
      let swapEase = 1;
      if (swapAnimRef.current.animating) {
        const elapsed = Date.now() - swapAnimRef.current.startTime;
        const duration = swapAnimRef.current.duration;
        const progress = Math.min(1, elapsed / duration);
        swapEase = 1 - Math.pow(1 - progress, 3);

        if (progress >= 1) {
          swapAnimRef.current.animating = false;
        }
      }

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Apply Camera 2D Pan and Zoom Transform from Refs
      ctx.translate(width / 2 + currentPan.x, height / 2 + currentPan.y);
      ctx.scale(currentScale, currentScale);
      ctx.translate(-width / 2, -height / 2);

      if (initialMode === 'orbit') {
        // Dynamic low-frequency oscillation calculation
        nodesMap.forEach((node) => {
          let bx = node.baseX;
          let by = node.baseY;

          if (swapAnimRef.current.animating) {
            const start = swapAnimRef.current.nodeStarts.get(node.id);
            const target = swapAnimRef.current.nodeTargets.get(node.id);
            if (start && target) {
              bx = start.x + (target.x - start.x) * swapEase;
              by = start.y + (target.y - start.y) * swapEase;
            }
          }

          const oscX = MAX_OSCILLATION_PX * Math.sin(node.oscSpeed * timeSec + node.oscPhaseX);
          const oscY = MAX_OSCILLATION_PX * Math.cos(node.oscSpeed * timeSec * 0.8 + node.oscPhaseY);

          node.x = bx + oscX;
          node.y = by + oscY;
        });

        // Background Orbit Rings
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

        // Render Links (Edges)
        graphData.links.forEach((link) => {
          const n1 = nodesMap.get(link.source);
          const n2 = nodesMap.get(link.target);

          if (n1 && n2) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);

            if (link.level === 1) {
              ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
              ctx.lineWidth = 2.2;
              ctx.setLineDash([]);
            } else {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
              ctx.lineWidth = 1.2;
              ctx.setLineDash([4, 4]);
            }

            ctx.stroke();
            ctx.setLineDash([]);
          }
        });

        // Render Nodes
        nodesMap.forEach((node) => {
          const color = MASTERY_COLORS[node.mastery];
          const isCenter = node.level === 0;
          const isSecondary = node.level === 2;

          ctx.save();
          if (isSecondary) {
            ctx.globalAlpha = 0.5;
          }

          const radius = isCenter ? 36 : isSecondary ? 18 : 23;

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = isCenter ? 'rgba(20, 26, 42, 0.95)' : 'rgba(15, 18, 28, 0.9)';
          ctx.fill();

          ctx.strokeStyle = color;
          ctx.lineWidth = isCenter ? 3.5 : 2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${isCenter ? '700 28px' : isSecondary ? '500 15px' : '600 18px'} Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.id, node.x, node.y - (isSecondary ? 1 : 2));

          if (!isSecondary || currentScale >= 0.85) {
            ctx.fillStyle = 'var(--accent-cyan)';
            ctx.font = `${isCenter ? '600 12px' : '500 10px'} Inter, sans-serif`;
            ctx.fillText(node.pinyin, node.x, node.y + (isCenter ? 18 : 13));
          }

          ctx.restore();
        });
      } else {
        // Interactive 3D Globe Mode (Show All)
        if (!isDraggingRef.current) {
          // Slow idle auto-spin when user is not dragging
          globeRotRef.current.y += 0.0012;
        }

        const rotX = globeRotRef.current.x;
        const rotY = globeRotRef.current.y;

        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);

        const projected = globNodes.map((n) => {
          // Rotate Y axis
          const x1 = n.rx * cosY - n.rz * sinY;
          const z1 = n.rx * sinY + n.rz * cosY;
          const y1 = n.ry;

          // Rotate X axis
          const y2 = y1 * cosX - z1 * sinX;
          const z2 = y1 * sinX + z1 * cosX;
          const x2 = x1;

          const perspective = 550;
          const k = perspective / (perspective + z2);
          const px = centerX + x2 * k;
          const py = centerY + y2 * k;
          const pRadius = Math.max(7, 15 * k);
          const alpha = Math.min(1, Math.max(0.15, (z2 + 300) / 600));

          return { ...n, px, py, pRadius, alpha, z2 };
        });

        projected.sort((a, b) => a.z2 - b.z2);

        // Draw 3D Globe Web Edges
        for (let i = 0; i < projected.length; i += 4) {
          for (let j = i + 1; j < Math.min(i + 5, projected.length); j++) {
            const p1 = projected[i];
            const p2 = projected[j];
            const dist = Math.hypot(p1.px - p2.px, p1.py - p2.py);

            if (dist < 110) {
              ctx.beginPath();
              ctx.moveTo(p1.px, p1.py);
              ctx.lineTo(p2.px, p2.py);
              ctx.strokeStyle = `rgba(0, 229, 255, ${0.1 * Math.min(p1.alpha, p2.alpha)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        // Draw 3D Globe Nodes
        projected.forEach((node) => {
          const color = MASTERY_COLORS[node.mastery];

          ctx.save();
          ctx.globalAlpha = node.alpha;

          ctx.beginPath();
          ctx.arc(node.px, node.py, node.pRadius, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(15, 18, 28, 0.9)';
          ctx.fill();

          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${Math.round(11 * (node.pRadius / 15))}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.id, node.px, node.py - 1);

          ctx.restore();
        });
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [initialMode, focusedChar, graphData, activeFilters]);

  // Pointer / Touch Handlers for Dragging & 3D Globe Rotation
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    startDragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
      rotX: globeRotRef.current.x,
      rotY: globeRotRef.current.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startDragRef.current.x;
    const dy = e.clientY - startDragRef.current.y;

    if (initialMode === 'orbit') {
      // 2D Camera Pan in Orbit Mode
      panRef.current = {
        x: startDragRef.current.panX + dx / scaleRef.current,
        y: startDragRef.current.panY + dy / scaleRef.current,
      };
    } else {
      // 3D Trackball Rotation in Show All Globe Mode
      globeRotRef.current = {
        x: startDragRef.current.rotX + dy * 0.005,
        y: startDragRef.current.rotY + dx * 0.005,
      };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const totalDragDistance = Math.hypot(
      e.clientX - startDragRef.current.x,
      e.clientY - startDragRef.current.y
    );

    isDraggingRef.current = false;

    if (totalDragDistance < 6) {
      handleCanvasClick(e);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(2.5, Math.max(0.4, scaleRef.current * zoomFactor));
    scaleRef.current = newScale;
  };

  // Node Selection Handler
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

    const worldX = (clickX - (width / 2 + panRef.current.x)) / scaleRef.current + width / 2;
    const worldY = (clickY - (height / 2 + panRef.current.y)) / scaleRef.current + height / 2;

    if (initialMode === 'orbit') {
      // Check center node click -> open detail modal
      if (Math.hypot(worldX - centerX, worldY - centerY) <= 38 && focusedChar) {
        setSelectedCharacter(focusedChar);
        return;
      }

      // Check primary satellite nodes
      const r1 = Math.min(width, height) * 0.28;
      const primaryNodes = graphData.rawNodes.filter((n) => n.level === 1);
      const n1 = primaryNodes.length;

      for (let idx = 0; idx < n1; idx++) {
        const item = primaryNodes[idx];
        const angle = (idx / n1) * 2 * Math.PI - Math.PI / 2;
        const nx = centerX + r1 * Math.cos(angle);
        const ny = centerY + r1 * Math.sin(angle);

        if (Math.hypot(worldX - nx, worldY - ny) <= 26) {
          triggerNodeSwapAnimation(item.char.id, nx, ny, centerX, centerY);
          return;
        }
      }

      // Check secondary foggy nodes
      const r2 = Math.min(width, height) * 0.44;
      const secondaryNodes = graphData.rawNodes.filter((n) => n.level === 2);
      const n2 = secondaryNodes.length;

      for (let idx = 0; idx < n2; idx++) {
        const item = secondaryNodes[idx];
        const angle = (idx / n2) * 2 * Math.PI - Math.PI / 4;
        const nx = centerX + r2 * Math.cos(angle);
        const ny = centerY + r2 * Math.sin(angle);

        if (Math.hypot(worldX - nx, worldY - ny) <= 22) {
          triggerNodeSwapAnimation(item.char.id, nx, ny, centerX, centerY);
          return;
        }
      }
    } else {
      // Show All Mode: Tapping a globe node centers it and switches to Orbit view!
      const rotX = globeRotRef.current.x;
      const rotY = globeRotRef.current.y;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const radius = Math.min(width, height) * 0.36;

      const visibleChars = characters.filter((c) => activeFilters[c.progress.mastery]);
      const phi = (1 + Math.sqrt(5)) / 2;
      const total = visibleChars.length;

      for (let i = 0; i < total; i++) {
        const c = visibleChars[i];
        const theta = (2 * Math.PI * i) / phi;
        const y = 1 - (i / (total - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const rx = Math.cos(theta) * radiusAtY * radius;
        const ry = y * radius;
        const rz = Math.sin(theta) * radiusAtY * radius;

        const x1 = rx * cosY - rz * sinY;
        const z1 = rx * sinY + rz * cosY;
        const y1 = ry;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        if (z2 > -100) {
          const perspective = 550;
          const k = perspective / (perspective + z2);
          const px = centerX + x1 * k;
          const py = centerY + y2 * k;

          if (Math.hypot(worldX - px, worldY - py) <= 20) {
            setFocusedCharId(c.id);
            setViewMode('orbit');
            return;
          }
        }
      }
    }
  };

  const triggerNodeSwapAnimation = (
    clickedCharId: string,
    clickedX: number,
    clickedY: number,
    centerX: number,
    centerY: number
  ) => {
    const nodeStarts = new Map<string, { x: number; y: number }>();
    const nodeTargets = new Map<string, { x: number; y: number }>();

    nodeStarts.set(clickedCharId, { x: clickedX, y: clickedY });
    nodeTargets.set(clickedCharId, { x: centerX, y: centerY });

    nodeStarts.set(focusedCharId, { x: centerX, y: centerY });
    nodeTargets.set(focusedCharId, { x: clickedX, y: clickedY });

    swapAnimRef.current = {
      animating: true,
      startTime: Date.now(),
      duration: 450,
      oldCenterId: focusedCharId,
      newCenterId: clickedCharId,
      nodeStarts,
      nodeTargets,
    };

    setFocusedCharId(clickedCharId);
  };

  const handleResetCamera = () => {
    panRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    globeRotRef.current = { x: 0.2, y: 0 };
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
      {/* Floating Info & Reset Controls */}
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
          title="Center Camera"
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

        {focusedChar && initialMode === 'orbit' && (
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

      {/* Mastery Filter Footer */}
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

      {/* Main Canvas */}
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
