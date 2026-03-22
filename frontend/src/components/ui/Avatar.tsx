import React from 'react';
import { classNames } from '@/utils/helpers';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const initial = name?.charAt(0).toUpperCase() || 'U';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={classNames(
          'rounded-full object-cover flex-shrink-0',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={classNames(
        'rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0',
        sizes[size],
        className
      )}
    >
      <span className="font-medium text-primary-700">{initial}</span>
    </div>
  );
};
