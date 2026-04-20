import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium';
  style?: React.CSSProperties;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  children,
  className,
  intensity = 'subtle',
  style,
}) => {
  const multiplier = intensity === 'medium' ? 1.3 : 1;

  return (
    <div className={cn('relative overflow-hidden', className)} style={style}>
      {/* Sky blue — dominant aurora tone */}
      <motion.div
        className="absolute"
        style={{
          width: '80%',
          height: '120%',
          top: '-20%',
          left: '10%',
          background: `radial-gradient(ellipse, rgba(147,197,253,${0.55 * multiplier}) 0%, rgba(96,165,250,${0.2 * multiplier}) 50%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Soft pink */}
      <motion.div
        className="absolute"
        style={{
          width: '50%',
          height: '80%',
          bottom: '-10%',
          right: '5%',
          background: `radial-gradient(ellipse, rgba(249,168,212,${0.45 * multiplier}) 0%, rgba(244,114,182,${0.15 * multiplier}) 50%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Soft purple */}
      <motion.div
        className="absolute"
        style={{
          width: '40%',
          height: '60%',
          top: '20%',
          right: '15%',
          background: `radial-gradient(ellipse, rgba(196,181,253,${0.45 * multiplier}) 0%, rgba(167,139,250,${0.15 * multiplier}) 50%, transparent 70%)`,
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, 40, -60, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Soft mint green */}
      <motion.div
        className="absolute"
        style={{
          width: '35%',
          height: '50%',
          bottom: '10%',
          left: '15%',
          background: `radial-gradient(ellipse, rgba(134,239,172,${0.35 * multiplier}) 0%, rgba(74,222,128,${0.1 * multiplier}) 50%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, -30, 50, 0],
          y: [0, 30, -15, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Soft yellow / warm glow */}
      <motion.div
        className="absolute"
        style={{
          width: '30%',
          height: '40%',
          top: '5%',
          left: '5%',
          background: `radial-gradient(ellipse, rgba(253,224,71,${0.3 * multiplier}) 0%, rgba(250,204,21,${0.08 * multiplier}) 50%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 40, -25, 0],
          y: [0, -25, 35, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{ duration: 23, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
