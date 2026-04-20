import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  triggerRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  gap?: number;
  matchWidth?: boolean;
}

export const Popover: React.FC<PopoverProps> = ({
  triggerRef,
  open,
  onClose,
  children,
  align = 'left',
  className = '',
  gap = 4,
  matchWidth = false,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number; width?: number } | null>(null);

  const recalc = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + gap,
      ...(align === 'right'
        ? { right: window.innerWidth - rect.right }
        : { left: rect.left }),
      ...(matchWidth ? { width: rect.width } : {}),
    });
  }, [triggerRef, align, gap, matchWidth]);

  useEffect(() => {
    if (!open) return;
    recalc();
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [open, recalc]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, onClose, triggerRef]);

  if (!open || !coords) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: coords.top,
    zIndex: 9999,
    ...(coords.left !== undefined ? { left: coords.left } : {}),
    ...(coords.right !== undefined ? { right: coords.right } : {}),
    ...(coords.width !== undefined ? { width: coords.width } : {}),
  };

  return createPortal(
    <div ref={popoverRef} style={style} className={className}>
      {children}
    </div>,
    document.body,
  );
};
