import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const WaterfallBackground: React.FC = () => {
  const prefersReduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="no-print fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
    >
      {/* Ambient Upper Crest & Plunge Basin Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_45%_at_50%_-5%,rgba(20,184,166,0.16),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_38%_at_50%_102%,rgba(16,185,129,0.14),transparent_68%)]" />

      {/* Stacked Waterfall Cascade Veils */}
      <motion.div
        animate={
          prefersReduced
            ? undefined
            : { x: [-4, 4, -4], opacity: [0.42, 0.58, 0.42] }
        }
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-y-0 left-[6%] w-[20%] sm:w-[15%] blur-md overflow-hidden"
      >
        <div className="w-full waterfall-sheet-slow" />
      </motion.div>

      <motion.div
        animate={
          prefersReduced
            ? undefined
            : { x: [3, -3, 3], opacity: [0.5, 0.68, 0.5] }
        }
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-y-0 left-[24%] w-[24%] sm:w-[18%] blur-lg overflow-hidden"
      >
        <div className="w-full waterfall-sheet" />
      </motion.div>

      <motion.div
        animate={
          prefersReduced
            ? undefined
            : { x: [-3, 5, -3], opacity: [0.46, 0.64, 0.46] }
        }
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-y-0 left-[48%] w-[22%] sm:w-[17%] blur-md overflow-hidden"
      >
        <div className="w-full waterfall-sheet" />
      </motion.div>

      <motion.div
        animate={
          prefersReduced
            ? undefined
            : { x: [4, -4, 4], opacity: [0.38, 0.55, 0.38] }
        }
        transition={{ duration: 12.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-y-0 right-[6%] w-[22%] sm:w-[16%] blur-lg overflow-hidden"
      >
        <div className="w-full waterfall-sheet-slow" />
      </motion.div>

      {/* Crisp Shimmering Water Threads (Parallax Foreground Streams) */}
      <div className="absolute inset-y-0 left-[14%] w-[3px] blur-[1px] opacity-50 overflow-hidden">
        <div className="w-full waterfall-thread" />
      </div>
      <div className="absolute inset-y-0 left-[34%] w-[4px] blur-[1.5px] opacity-45 overflow-hidden">
        <div className="w-full waterfall-thread-alt" />
      </div>
      <div className="hidden sm:block absolute inset-y-0 left-[57%] w-[3px] blur-[1px] opacity-45 overflow-hidden">
        <div className="w-full waterfall-thread" />
      </div>
      <div className="absolute inset-y-0 right-[16%] w-[4px] blur-[1.5px] opacity-45 overflow-hidden">
        <div className="w-full waterfall-thread-alt" />
      </div>

      {/* Gentle Expanding Water Ripples at the Plunge Basin */}
      {!prefersReduced && (
        <div className="absolute inset-x-0 bottom-0 h-44 overflow-hidden">
          <div className="waterfall-ripple-ring absolute left-[12%] bottom-8 w-44 sm:w-64 h-10 rounded-[100%] border border-teal-400/25" />
          <div className="waterfall-ripple-ring-delayed absolute left-[38%] bottom-12 w-56 sm:w-80 h-12 rounded-[100%] border border-emerald-400/20" />
          <div className="waterfall-ripple-ring absolute right-[10%] bottom-7 w-40 sm:w-60 h-9 rounded-[100%] border border-cyan-300/20" />
          <motion.div
            animate={{ scaleX: [0.96, 1.05, 0.96], opacity: [0.22, 0.38, 0.22] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[75%] h-14 rounded-[100%] border-t border-teal-300/20 bg-gradient-to-b from-teal-400/10 to-transparent blur-sm"
          />
        </div>
      )}

      {/* Rising Soft Waterfall Mist */}
      <motion.div
        animate={
          prefersReduced
            ? undefined
            : { y: [0, -10, 0], opacity: [0.28, 0.48, 0.28] }
        }
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-emerald-950/55 via-teal-950/20 to-transparent blur-xl"
      />

      {/* Contrast Vignette for Crisp Foreground Readability */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(2,6,23,0.22)_0%,rgba(2,6,23,0.72)_100%)]" />
    </div>
  );
};
