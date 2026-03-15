import React from 'react';
import { classNames } from '@/utils/helpers';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = false, className, ...props }) => {
  return (
    <div
      className={classNames(
        'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden',
        hoverable && 'hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={classNames('px-6 py-4 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3 className={classNames('text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={classNames('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={classNames('px-6 py-4 bg-gray-50 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  );
};
