import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = false, className, onClick, style }) => {
  if (hoverable) {
    return (
      <motion.div
        className={cn(
          'rounded-feature border border-border bg-card text-card-foreground shadow-clay-sm overflow-hidden flex flex-col cursor-pointer',
          className
        )}
        whileHover={{ y: -2, boxShadow: '3px 3px 0 0 hsl(var(--foreground) / 0.1), 6px 6px 0 0 hsl(var(--foreground) / 0.05)' }}
        transition={{ duration: 0.15 }}
        onClick={onClick}
        style={style}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-feature border border-border bg-card text-card-foreground shadow-clay-sm overflow-hidden flex flex-col',
        className
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('flex flex-col space-y-1.5 p-6 pb-4 border-b border-border', className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3 className={cn('text-feature-title font-semibold leading-tight tracking-tight', className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('p-6 pt-4', className)} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('flex items-center p-6 pt-0 border-t border-border bg-muted/30', className)} {...props} />
);
