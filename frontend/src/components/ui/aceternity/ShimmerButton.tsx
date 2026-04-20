import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps {
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  variant = 'primary',
  children,
  className,
  onClick,
}) => {
  const baseStyles = 'relative overflow-hidden rounded-standard font-medium px-6 py-3 text-sm transition-all duration-300';

  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 shadow-clay-sm hover:shadow-clay',
    outline: 'bg-white/60 backdrop-blur-sm border-2 border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-white/80',
  };

  return (
    <motion.button
      className={cn(baseStyles, variantStyles[variant], className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Shimmer sweep */}
      <motion.span
        className="absolute inset-0 -translate-x-full"
        style={{
          background: variant === 'primary'
            ? 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)'
            : 'linear-gradient(110deg, transparent 30%, rgba(147,197,253,0.2) 50%, transparent 70%)',
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};
