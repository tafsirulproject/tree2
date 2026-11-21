import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { formatBnNumber, formatCurrency } from '../utils/fundUtils';

interface LivingFundTreeProps {
  progressPercent: number;
  memberCount: number;
  clearCount: number;
  totalDeposit: number;
}

interface FallingLeaf {
  id: number;
  startX: number;
  startY: number;
  driftX: number;
  endY: number;
  rotateStart: number;
  rotateEnd: number;
  scale: number;
  colorLeft: string;
  colorRight: string;
}

interface LeafClusterSpec {
  x: number;
  y: number;
  angle: number;
  scale: number;
  layer: 'back' | 'mid' | 'front';
  threshold: number;
  swayDelay: number;
}

// Coordinates relative to tree base at (140, 190) -> converted to SVG canvas (0..280, 0..210)
const FOLIAGE_CLUSTERS: LeafClusterSpec[] = [
  // Core lush crown & primary bough leaves (always visible at 0%+ so tree always looks alive & leafy)
  { x: 140, y: 58, angle: 0, scale: 1.08, layer: 'back', threshold: 0, swayDelay: 0.0 },
  { x: 122, y: 74, angle: -28, scale: 0.96, layer: 'mid', threshold: 0, swayDelay: 0.2 },
  { x: 158, y: 72, angle: 26, scale: 0.96, layer: 'mid', threshold: 0, swayDelay: 0.35 },
  { x: 140, y: 70, angle: 4, scale: 0.94, layer: 'front', threshold: 0, swayDelay: 0.15 },
  { x: 100, y: 102, angle: -44, scale: 0.92, layer: 'mid', threshold: 0, swayDelay: 0.4 },
  { x: 180, y: 100, angle: 42, scale: 0.92, layer: 'mid', threshold: 0, swayDelay: 0.5 },

  // Early growth bloom (5% - 25%)
  { x: 84, y: 112, angle: -56, scale: 0.95, layer: 'back', threshold: 5, swayDelay: 0.25 },
  { x: 196, y: 110, angle: 54, scale: 0.95, layer: 'back', threshold: 8, swayDelay: 0.45 },
  { x: 114, y: 90, angle: -24, scale: 0.9, layer: 'front', threshold: 12, swayDelay: 0.1 },
  { x: 166, y: 88, angle: 24, scale: 0.9, layer: 'front', threshold: 15, swayDelay: 0.3 },
  { x: 72, y: 118, angle: -68, scale: 0.88, layer: 'mid', threshold: 20, swayDelay: 0.55 },
  { x: 208, y: 116, angle: 66, scale: 0.88, layer: 'mid', threshold: 24, swayDelay: 0.2 },

  // Mid canopy expansion (28% - 60%)
  { x: 108, y: 66, angle: -34, scale: 1.0, layer: 'back', threshold: 28, swayDelay: 0.4 },
  { x: 172, y: 64, angle: 34, scale: 1.0, layer: 'back', threshold: 32, swayDelay: 0.15 },
  { x: 92, y: 84, angle: -42, scale: 0.94, layer: 'mid', threshold: 36, swayDelay: 0.6 },
  { x: 188, y: 82, angle: 42, scale: 0.94, layer: 'mid', threshold: 40, swayDelay: 0.25 },
  { x: 126, y: 54, angle: -18, scale: 0.96, layer: 'front', threshold: 45, swayDelay: 0.5 },
  { x: 154, y: 54, angle: 18, scale: 0.96, layer: 'front', threshold: 50, swayDelay: 0.35 },
  { x: 64, y: 104, angle: -50, scale: 0.86, layer: 'front', threshold: 55, swayDelay: 0.1 },
  { x: 216, y: 102, angle: 50, scale: 0.86, layer: 'front', threshold: 60, swayDelay: 0.45 },

  // Full lush crown & cascading outer foliage (65% - 100%)
  { x: 140, y: 40, angle: 0, scale: 1.05, layer: 'mid', threshold: 65, swayDelay: 0.2 },
  { x: 128, y: 42, angle: -22, scale: 0.92, layer: 'front', threshold: 70, swayDelay: 0.55 },
  { x: 152, y: 42, angle: 22, scale: 0.92, layer: 'front', threshold: 75, swayDelay: 0.3 },
  { x: 82, y: 98, angle: -36, scale: 0.9, layer: 'front', threshold: 80, swayDelay: 0.15 },
  { x: 198, y: 96, angle: 36, scale: 0.9, layer: 'front', threshold: 85, swayDelay: 0.4 },
  { x: 104, y: 54, angle: -30, scale: 0.92, layer: 'mid', threshold: 90, swayDelay: 0.65 },
  { x: 176, y: 54, angle: 30, scale: 0.92, layer: 'mid', threshold: 94, swayDelay: 0.25 },
  { x: 140, y: 28, angle: -4, scale: 0.95, layer: 'front', threshold: 98, swayDelay: 0.1 },
];

const LAYER_PALETTE: Record<
  LeafClusterSpec['layer'],
  { left: string; right: string; vein: string }
> = {
  back: { left: '#047857', right: '#064e3b', vein: '#065f46' },
  mid: { left: '#10b981', right: '#059669', vein: '#34d399' },
  front: { left: '#34d399', right: '#10b981', vein: '#a7f3d0' },
};

const AMBIENT_MOTES = [
  { cx: 76, cy: 76, r: 1.6, delay: 0 },
  { cx: 204, cy: 72, r: 1.8, delay: 0.9 },
  { cx: 112, cy: 36, r: 1.5, delay: 1.6 },
  { cx: 170, cy: 40, r: 1.7, delay: 2.2 },
  { cx: 62, cy: 132, r: 1.4, delay: 0.5 },
  { cx: 218, cy: 128, r: 1.5, delay: 1.3 },
];

const GRASS_BLADES = [
  { x: 74, y: 194, h: 14, lean: -5 },
  { x: 80, y: 194, h: 10, lean: 2 },
  { x: 96, y: 193, h: 13, lean: -4 },
  { x: 184, y: 193, h: 13, lean: 4 },
  { x: 200, y: 194, h: 11, lean: -2 },
  { x: 206, y: 194, h: 15, lean: 5 },
];

const SKY_STARS = [
  { cx: 34, cy: 26, r: 1.0, delay: 0.2 },
  { cx: 64, cy: 18, r: 0.85, delay: 1.1 },
  { cx: 92, cy: 30, r: 1.1, delay: 0.6 },
  { cx: 188, cy: 22, r: 0.9, delay: 1.5 },
  { cx: 244, cy: 48, r: 1.0, delay: 0.9 },
  { cx: 46, cy: 62, r: 0.85, delay: 2.0 },
  { cx: 236, cy: 84, r: 0.9, delay: 0.4 },
];

const RIVER_PEBBLES = [
  { cx: 64, cy: 187, rx: 2.4, ry: 1.2, fill: '#334155' },
  { cx: 70, cy: 189, rx: 1.7, ry: 0.9, fill: '#475569' },
  { cx: 112, cy: 192.5, rx: 2.8, ry: 1.3, fill: '#334155' },
  { cx: 176, cy: 193, rx: 2.6, ry: 1.2, fill: '#1e293b' },
  { cx: 182, cy: 194, rx: 1.8, ry: 0.9, fill: '#475569' },
  { cx: 138, cy: 213, rx: 3.1, ry: 1.4, fill: '#334155' },
  { cx: 214, cy: 215.5, rx: 2.9, ry: 1.3, fill: '#1e293b' },
  { cx: 222, cy: 216.5, rx: 2.0, ry: 1.0, fill: '#475569' },
];

const RIVER_CURRENTS = [
  {
    d: 'M -10 179.5 C 32 181.5, 66 191.5, 108 199.5 C 148 207.5, 200 202.5, 290 207.5',
    stroke: '#5eead4',
    width: 1.45,
    opacity: 0.55,
    dash: '18 26 9 22',
    offset: -150,
    duration: 3.2,
  },
  {
    d: 'M -10 178.2 C 32 179.5, 66 189.2, 108 195.8 C 146 201.5, 198 195.5, 290 199.5',
    stroke: '#2dd4bf',
    width: 1.1,
    opacity: 0.42,
    dash: '12 22 6 24',
    offset: -128,
    duration: 4.1,
  },
  {
    d: 'M -10 180.8 C 32 183.2, 66 194, 108 203.2 C 150 212, 202 208.5, 290 214.5',
    stroke: '#14b8a6',
    width: 1.25,
    opacity: 0.45,
    dash: '14 28 10 20',
    offset: -144,
    duration: 3.7,
  },
  {
    d: 'M 106 199.5 C 154 207.5, 210 201.5, 288 205.5',
    stroke: '#ccfbf1',
    width: 1.25,
    opacity: 0.65,
    dash: '5 18 11 26',
    offset: -120,
    duration: 2.7,
  },
];

// Reusable realistic two-tone botanical leaflet with central midrib & side veins
const LeafSprigArtwork: React.FC<{ left: string; right: string; vein: string }> = ({
  left,
  right,
  vein,
}) => (
  <g>
    {/* Left Angled Leaflet */}
    <g transform="translate(-3, -2) rotate(-38) scale(0.84)">
      <path d="M 0 0 C -8 -6, -9 -18, 0 -26 L 0 0 Z" fill={left} />
      <path d="M 0 0 C 8 -6, 9 -18, 0 -26 L 0 0 Z" fill={right} />
      <path d="M 0 -1 L 0 -23" stroke={vein} strokeWidth="0.8" opacity="0.7" />
    </g>

    {/* Right Angled Leaflet */}
    <g transform="translate(3, -2) rotate(38) scale(0.84)">
      <path d="M 0 0 C -8 -6, -9 -18, 0 -26 L 0 0 Z" fill={left} />
      <path d="M 0 0 C 8 -6, 9 -18, 0 -26 L 0 0 Z" fill={right} />
      <path d="M 0 -1 L 0 -23" stroke={vein} strokeWidth="0.8" opacity="0.7" />
    </g>

    {/* Center Main Leaf (Two-Tone Half-Shaded) */}
    <g transform="translate(0, 0)">
      <path d="M 0 1 C -9 -7, -10 -21, 0 -30 L 0 1 Z" fill={left} />
      <path d="M 0 1 C 9 -7, 10 -21, 0 -30 L 0 1 Z" fill={right} />
      {/* Midrib & Lateral Veins */}
      <path
        d="M 0 0 L 0 -26 M 0 -9 L -4 -14 M 0 -15 L -3.5 -20 M 0 -11 L 4 -16 M 0 -17 L 3.5 -22"
        fill="none"
        stroke={vein}
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.75"
      />
    </g>
  </g>
);

export const LivingFundTree: React.FC<LivingFundTreeProps> = ({
  progressPercent,
  memberCount,
  clearCount,
  totalDeposit,
}) => {
  const prefersReduced = useReducedMotion();
  const [tapCount, setTapCount] = useState(0);
  const [fallingLeaves, setFallingLeaves] = useState<FallingLeaf[]>([]);

  const handleTreeTap = () => {
    setTapCount((c) => c + 1);
    if (prefersReduced) return;

    const batch = Date.now();
    const spawned: FallingLeaf[] = [
      {
        id: batch + 1,
        startX: 96,
        startY: 96,
        driftX: -28,
        endY: 192,
        rotateStart: -25,
        rotateEnd: 160,
        scale: 0.95,
        colorLeft: '#34d399',
        colorRight: '#059669',
      },
      {
        id: batch + 2,
        startX: 140,
        startY: 64,
        driftX: 24,
        endY: 193,
        rotateStart: 15,
        rotateEnd: -175,
        scale: 1.0,
        colorLeft: '#6ee7b7',
        colorRight: '#10b981',
      },
      {
        id: batch + 3,
        startX: 184,
        startY: 98,
        driftX: 32,
        endY: 191,
        rotateStart: 30,
        rotateEnd: 210,
        scale: 0.9,
        colorLeft: '#10b981',
        colorRight: '#047857',
      },
      {
        id: batch + 4,
        startX: 118,
        startY: 74,
        driftX: -18,
        endY: 194,
        rotateStart: -12,
        rotateEnd: -140,
        scale: 0.85,
        colorLeft: '#34d399',
        colorRight: '#10b981',
      },
      {
        id: batch + 5,
        startX: 162,
        startY: 78,
        driftX: 14,
        endY: 192,
        rotateStart: 8,
        rotateEnd: 135,
        scale: 0.82,
        colorLeft: '#6ee7b7',
        colorRight: '#059669',
      },
    ];

    setFallingLeaves((prev) => [...prev.slice(-10), ...spawned]);
    setTimeout(() => {
      setFallingLeaves((prev) => prev.filter((item) => !spawned.some((s) => s.id === item.id)));
    }, 1700);
  };

  const growthStage =
    progressPercent >= 85
      ? 'পূর্ণ বৃক্ষ'
      : progressPercent >= 50
      ? 'পল্লবিত'
      : progressPercent >= 20
      ? 'বর্ধনশীল'
      : 'নবীন বৃক্ষ';

  const hasBranches = progressPercent >= 5 || memberCount > 0;
  const hasCrown = progressPercent >= 25 || memberCount > 0;

  return (
    <motion.button
      type="button"
      onClick={handleTreeTap}
      whileTap={{ scale: 0.97 }}
      aria-label={`Tree ফান্ড গ্রোথ ভিজ্যুয়ালাইজেশন: ${progressPercent}% সংগৃহীত`}
      className="group relative w-full bg-gradient-to-b from-[#041815] via-[#06231c] to-[#081523] border border-emerald-500/25 hover:border-emerald-400/50 rounded-2xl p-4 flex flex-col items-center justify-between gap-2 overflow-hidden transition-colors touch-manipulation cursor-pointer"
    >
      {/* Ambient Forest Horizon Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(16,185,129,0.16),transparent_68%)]" />

      {/* Dappled Moonlight / Canopy Aura */}
      <motion.div
        animate={
          prefersReduced
            ? undefined
            : {
                scale: [1, 1.08, 1],
                opacity: [0.24, 0.38, 0.24],
              }
        }
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl"
      />

      {/* Diagonal Moonlight Shafts */}
      {!prefersReduced && (
        <motion.div
          animate={{ opacity: [0.06, 0.16, 0.06], x: [-6, 8, -6] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-10 right-6 w-24 h-64 bg-gradient-to-b from-teal-200/20 via-emerald-400/5 to-transparent rotate-25 blur-xl"
        />
      )}

      {/* Drifting Ground Mist */}
      {!prefersReduced && (
        <motion.div
          animate={{ x: [-12, 12, -12], opacity: [0.18, 0.32, 0.18] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute bottom-10 inset-x-0 h-10 bg-gradient-to-t from-emerald-500/15 via-teal-400/10 to-transparent blur-md"
        />
      )}

      {/* Tap Shimmer Pulse Ring */}
      <AnimatePresence>
        {tapCount > 0 && !prefersReduced && (
          <motion.div
            key={`pulse-${tapCount}`}
            initial={{ scale: 0.3, opacity: 0.45 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-emerald-400/40"
          />
        )}
      </AnimatePresence>

      {/* Top Stage Header */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 z-10">
        <span className="font-semibold text-emerald-400">{growthStage}</span>
        <span className="font-num tabular-nums">{formatBnNumber(progressPercent)}%</span>
      </div>

      {/* Realistic Botanical SVG Tree & Flowing Forest River */}
      <svg
        viewBox="0 -6 280 226"
        className="w-full max-w-[270px] h-48 sm:h-52 z-10 overflow-visible"
      >
        <defs>
          {/* Bark Horizontal Shading */}
          <linearGradient id="realisticBark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a06c49" />
            <stop offset="40%" stopColor="#734a31" />
            <stop offset="100%" stopColor="#3c2315" />
          </linearGradient>

          {/* Branch Bark */}
          <linearGradient id="branchBark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8d5d3f" />
            <stop offset="100%" stopColor="#452a19" />
          </linearGradient>

          {/* Soil & Moss Shadow */}
          <radialGradient id="soilMound" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Golden Fruit */}
          <radialGradient id="goldenFruit" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>

          {/* Soft Forest Moon Halo */}
          <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#34d399" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
          </radialGradient>

          {/* Realistic Flowing River Depth Gradient */}
          <linearGradient id="riverBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.88" />
            <stop offset="45%" stopColor="#0d9488" stopOpacity="0.94" />
            <stop offset="100%" stopColor="#042f2e" stopOpacity="0.98" />
          </linearGradient>

          {/* River Deep Center Channel */}
          <linearGradient id="riverDepth" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#134e4a" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#115e59" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.82" />
          </linearGradient>

          {/* Moonlight Reflection on Water */}
          <radialGradient id="riverMoonGlint" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ccfbf1" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#2dd4bf" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Twinkling Twilight Stars */}
        {SKY_STARS.map((star, i) => (
          <motion.circle
            key={`star-${i}`}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill="#a7f3d0"
            animate={prefersReduced ? { opacity: 0.45 } : { opacity: [0.2, 0.8, 0.2] }}
            transition={{
              duration: 3.0 + i * 0.45,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: star.delay,
            }}
          />
        ))}

        {/* Crescent Forest Moon & Halo */}
        <g transform="translate(226, 30)">
          <motion.circle
            cx="0"
            cy="0"
            r="22"
            fill="url(#moonHalo)"
            animate={prefersReduced ? undefined : { scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <path
            d="M 4 -8 A 9 9 0 1 0 9 6 A 7 7 0 1 1 4 -8 Z"
            fill="#d1fae5"
            opacity="0.72"
          />
        </g>

        {/* Distant Rolling Forest Hills */}
        <path
          d="M -10 192 Q 48 156 116 176 Q 178 158 232 170 Q 264 160 290 176 L 290 222 L -10 222 Z"
          fill="#062922"
          opacity="0.78"
        />
        <path
          d="M -10 194 Q 65 170 142 182 Q 214 168 290 186 L 290 222 L -10 222 Z"
          fill="#05201a"
          opacity="0.92"
        />

        {/* Realistic Winding Forest River (Perspective Flow from Distant Valley to Foreground) */}
        <g>
          {/* Outer Earthy & Mossy Riverbank Rim */}
          <path
            d="M -10 175.5 C 32 176.5, 66 186.5, 108 191.5 C 144 195.5, 196 188.5, 290 193.5 L 290 223 C 210 218, 152 220, 104 209 C 60 199, 24 186.5, -10 183.5 Z"
            fill="#0b3b32"
            opacity="0.7"
          />

          {/* Main River Water Surface */}
          <path
            d="M -10 177 C 32 178, 66 188, 108 193 C 144 197, 196 190, 290 195 L 290 221 C 210 216, 152 218, 104 207 C 60 197, 24 185, -10 182 Z"
            fill="url(#riverBody)"
          />

          {/* Subtle Depth Shading Along Lower Bank */}
          <path
            d="M -10 177 C 32 178, 66 188, 108 193 C 144 197, 196 190, 290 195 L 290 221 C 210 216, 152 218, 104 207 C 60 197, 24 185, -10 182 Z"
            fill="url(#riverDepth)"
          />

          {/* Moonlight Shimmer Reflection on the Water */}
          <motion.ellipse
            cx="222"
            cy="205"
            rx="32"
            ry="6.5"
            fill="url(#riverMoonGlint)"
            style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            animate={
              prefersReduced
                ? undefined
                : { opacity: [0.55, 0.95, 0.55], scaleX: [0.94, 1.08, 0.94] }
            }
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Soft Shoreline Foam Highlights */}
          <motion.path
            d="M -10 177.3 C 32 178.3, 66 188.3, 108 193.3 C 144 197.3, 196 190.3, 290 195.3"
            fill="none"
            stroke="#99f6e4"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.35"
            strokeDasharray="10 16 4 14"
            animate={prefersReduced ? undefined : { strokeDashoffset: [0, -88] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Multi-Layered Flowing Water Currents */}
          {RIVER_CURRENTS.map((stream, idx) => (
            <motion.path
              key={`stream-${idx}`}
              d={stream.d}
              fill="none"
              stroke={stream.stroke}
              strokeWidth={stream.width}
              strokeLinecap="round"
              opacity={stream.opacity}
              strokeDasharray={stream.dash}
              animate={
                prefersReduced ? undefined : { strokeDashoffset: [0, stream.offset] }
              }
              transition={{
                duration: stream.duration,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          {/* Gentle Expanding Water Ripples */}
          {!prefersReduced && (
            <>
              <motion.ellipse
                cx="148"
                cy="202"
                rx="8"
                ry="2.2"
                fill="none"
                stroke="#99f6e4"
                strokeWidth="0.8"
                style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
                initial={{ scale: 0.4, opacity: 0.6 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.ellipse
                cx="212"
                cy="207"
                rx="9"
                ry="2.5"
                fill="none"
                stroke="#a7f3d0"
                strokeWidth="0.8"
                style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
                initial={{ scale: 0.4, opacity: 0.55 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 1.5,
                }}
              />
            </>
          )}

          {/* Tap-Triggered Water Splash Ripple */}
          <AnimatePresence>
            {tapCount > 0 && !prefersReduced && (
              <motion.ellipse
                key={`river-splash-${tapCount}`}
                cx="162"
                cy="203"
                rx="10"
                ry="2.8"
                fill="none"
                stroke="#ccfbf1"
                strokeWidth="1.2"
                style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
                initial={{ scale: 0.3, opacity: 0.85 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* Smooth Shoreline River Pebbles */}
          {RIVER_PEBBLES.map((pebble, idx) => (
            <ellipse
              key={`pebble-${idx}`}
              cx={pebble.cx}
              cy={pebble.cy}
              rx={pebble.rx}
              ry={pebble.ry}
              fill={pebble.fill}
              opacity="0.85"
            />
          ))}
        </g>

        {/* Elevated Mossy Tree Knoll Group (Lifted 8px cleanly above the river shoreline) */}
        <g transform="translate(0, -8)">
          {/* Ground Earth Mound & Mossy Base */}
          <ellipse cx="140" cy="194" rx="86" ry="9.5" fill="url(#soilMound)" />
          <ellipse cx="140" cy="193" rx="54" ry="5" fill="#065f46" opacity="0.45" />

        {/* Gently Swaying Grass Blades */}
        {GRASS_BLADES.map((blade, i) => (
          <g key={i} transform={`translate(${blade.x}, ${blade.y})`}>
            <motion.path
              d={`M 0 0 Q ${blade.lean * 0.5} ${-blade.h * 0.5} ${blade.lean} ${-blade.h}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity={0.55}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              animate={prefersReduced ? undefined : { rotate: [-5, 5, -5] }}
              transition={{
                duration: 3.2 + i * 0.35,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>
        ))}

        {/* Ambient Floating Forest Fireflies / Dew Motes */}
        {!prefersReduced &&
          AMBIENT_MOTES.map((mote, i) => (
            <motion.circle
              key={`mote-${i}`}
              cx={mote.cx}
              cy={mote.cy}
              r={mote.r}
              fill="#6ee7b7"
              animate={{
                y: [0, -8, 0],
                opacity: [0.15, 0.75, 0.15],
              }}
              transition={{
                duration: 3.4 + i * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: mote.delay,
              }}
            />
          ))}

        {/* Delicate Forest Butterfly Gliding Near Canopy */}
        {!prefersReduced && (
          <g transform="translate(186, 52)">
            <motion.g
              animate={{
                x: [0, -14, -6, 10, 0],
                y: [0, -10, -16, -6, 0],
                rotate: [-8, 10, -4, 12, -8],
              }}
              transition={{
                duration: 8.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.path
                d="M 0 0 C -4 -5, -7 -2, -3 2 Z"
                fill="#fbbf24"
                opacity="0.85"
                style={{ transformBox: 'fill-box', transformOrigin: '100% 50%' }}
                animate={{ scaleX: [1, 0.35, 1] }}
                transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.path
                d="M 0 0 C 4 -5, 7 -2, 3 2 Z"
                fill="#f59e0b"
                opacity="0.85"
                style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
                animate={{ scaleX: [1, 0.35, 1] }}
                transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>
          </g>
        )}

        {/* Tree Anchor at Root Base */}
        <g transform="translate(140, 192)">
          <motion.g
            key={tapCount > 0 ? `sway-${tapCount}` : 'idle'}
            style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
            animate={
              prefersReduced
                ? undefined
                : tapCount > 0
                ? { rotate: [0, -2.8, 2.4, -1.4, 0.6, 0] }
                : { rotate: [0, 0.7, 0, -0.7, 0] }
            }
            transition={
              tapCount > 0
                ? { duration: 0.75, ease: 'easeOut' }
                : { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            {/* Translate Back to Canvas Coordinates Inside the Rotated Anchor */}
            <g transform="translate(-140, -192)">
              {/* Soft Back Canopy Silhouette Depth Behind Branches */}
              <motion.ellipse
                cx="140"
                cy="78"
                rx={progressPercent >= 40 ? 64 : 42}
                ry={progressPercent >= 40 ? 40 : 28}
                fill="#064e3b"
                opacity={0.38}
                animate={
                  prefersReduced ? undefined : { scale: [0.98, 1.03, 0.98] }
                }
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Flared Roots & Tapered Trunk */}
              <path
                d="
                  M 121 193
                  C 127 184, 132 174, 133 156
                  C 134 138, 132 122, 134 106
                  L 138 74
                  L 142 74
                  L 146 106
                  C 148 122, 147 140, 149 158
                  C 150 175, 155 184, 162 193
                  Q 148 190, 141 193
                  Q 133 190, 121 193 Z
                "
                fill="url(#realisticBark)"
              />

              {/* Root Extensions */}
              <path
                d="M 131 188 Q 115 189 102 194 Q 117 192 130 192 Z"
                fill="#4d3121"
              />
              <path
                d="M 150 188 Q 166 189 179 194 Q 164 192 151 192 Z"
                fill="#3a2316"
              />

              {/* Bark Texture & Highlights */}
              <path
                d="M 135 180 C 136 160, 135 140, 137 118"
                fill="none"
                stroke="#b67f5a"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 140 170 C 141 154, 140 138, 141 122"
                fill="none"
                stroke="#362013"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.65"
              />
              <path
                d="M 145 178 C 144 162, 145 146, 144 128"
                fill="none"
                stroke="#2a180e"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Left Primary Bough */}
              <path
                d="
                  M 135 128
                  C 124 121, 108 114, 92 106
                  L 72 116
                  L 71 114
                  L 90 102
                  C 107 109, 122 114, 135 119 Z
                "
                fill="url(#branchBark)"
                opacity={hasBranches ? 1 : 0.7}
              />

              {/* Right Primary Bough */}
              <path
                d="
                  M 146 123
                  C 158 116, 174 110, 190 103
                  L 209 113
                  L 210 111
                  L 191 99
                  C 174 104, 159 109, 145 114 Z
                "
                fill="url(#branchBark)"
                opacity={hasBranches ? 1 : 0.7}
              />

              {/* Upper Secondary Branches & Crown Twigs */}
              <g opacity={hasCrown ? 1 : 0.75}>
                <path
                  d="M 137 100 C 128 88, 118 76, 110 64 L 112 63 C 121 74, 131 85, 139 95 Z"
                  fill="#68432d"
                />
                <path
                  d="M 143 98 C 152 86, 162 75, 170 63 L 168 62 C 160 73, 150 84, 141 93 Z"
                  fill="#563623"
                />
                <path
                  d="M 139 84 C 139 68, 140 54, 140 38 L 142 38 C 142 54, 142 68, 141 84 Z"
                  fill="#68432d"
                />
                {/* Fine Outer Twigs */}
                <path
                  d="M 105 107 Q 95 96 86 86 M 176 105 Q 186 94 194 84"
                  fill="none"
                  stroke="#5b3a26"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>

              {/* Real Botanical Foliage Clusters — Static <g> handles position, Inner <motion.g> handles scale & breeze sway */}
              {(['back', 'mid', 'front'] as const).map((layerName) =>
                FOLIAGE_CLUSTERS.filter((leaf) => leaf.layer === layerName).map(
                  (leaf, idx) => {
                    const unlocked = progressPercent >= leaf.threshold;
                    const palette = LAYER_PALETTE[leaf.layer];

                    return (
                      <g
                        key={`${layerName}-${idx}`}
                        transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.angle})`}
                      >
                        <motion.g
                          style={{ transformBox: 'fill-box', transformOrigin: '50% 95%' }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: unlocked ? leaf.scale : leaf.scale * 0.42,
                            opacity: unlocked ? 1 : 0.25,
                            rotate:
                              unlocked && !prefersReduced ? [-4, 4, -4] : 0,
                          }}
                          transition={{
                            scale: {
                              type: 'spring',
                              stiffness: 240,
                              damping: 18,
                              delay: leaf.swayDelay * 0.35,
                            },
                            opacity: { duration: 0.4 },
                            rotate: {
                              duration: 3.4 + (idx % 4) * 0.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: leaf.swayDelay,
                            },
                          }}
                        >
                          <LeafSprigArtwork
                            left={palette.left}
                            right={palette.right}
                            vein={palette.vein}
                          />
                        </motion.g>
                      </g>
                    );
                  }
                )
              )}

              {/* Golden Ripe Blossoms / Fruits on Active Branches */}
              {clearCount > 0 && (
                <g>
                  <g transform="translate(102, 96)">
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="4.2"
                      fill="url(#goldenFruit)"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.16, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </g>
                  <g transform="translate(178, 94)">
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="4.2"
                      fill="url(#goldenFruit)"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.16, 1] }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.4,
                      }}
                    />
                  </g>
                </g>
              )}

              {progressPercent >= 70 && (
                <g transform="translate(140, 56)">
                  <motion.circle
                    cx="0"
                    cy="0"
                    r="4.4"
                    fill="url(#goldenFruit)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.25,
                    }}
                  />
                </g>
              )}
            </g>
          </motion.g>
        </g>

        {/* Tap-Triggered Real Two-Tone Falling Leaves */}
        <AnimatePresence>
          {fallingLeaves.map((leaf) => (
            <g key={leaf.id} transform={`translate(${leaf.startX}, ${leaf.startY})`}>
              <motion.g
                style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
                initial={{
                  x: 0,
                  y: 0,
                  rotate: leaf.rotateStart,
                  scale: leaf.scale,
                  opacity: 0.95,
                }}
                animate={{
                  x: [0, leaf.driftX * 0.55, leaf.driftX * 0.15, leaf.driftX],
                  y: leaf.endY - leaf.startY,
                  rotate: leaf.rotateEnd,
                  opacity: [0.95, 0.95, 0.8, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <path d="M 0 0 C -5 -5, -5 -13, 0 -18 L 0 0 Z" fill={leaf.colorLeft} />
                <path d="M 0 0 C 5 -5, 5 -13, 0 -18 L 0 0 Z" fill={leaf.colorRight} />
              </motion.g>
            </g>
          ))}
        </AnimatePresence>
        </g>
      </svg>

      {/* Bottom Caption */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 z-10 border-t border-slate-800/70 pt-2">
        <span className="truncate">ট্যাপ করুন · {formatBnNumber(memberCount)} জন</span>
        <span className="font-semibold text-emerald-400 font-num shrink-0">
          {formatCurrency(totalDeposit)}
        </span>
      </div>
    </motion.button>
  );
};
