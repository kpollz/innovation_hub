import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextGenerateEffectProps {
  text: string;
  speed?: number;
  className?: string;
}

export const TextGenerateEffect: React.FC<TextGenerateEffectProps> = ({
  text,
  speed = 60,
  className,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    setVisibleCount(0);
  }, [text]);

  useEffect(() => {
    if (visibleCount >= words.length) return;
    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [visibleCount, words.length, speed]);

  return (
    <span className={cn('inline', className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
          animate={i < visibleCount ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {word}{i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
};
