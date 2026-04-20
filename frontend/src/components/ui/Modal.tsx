import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              forceMount
              className={cn(
                'fixed left-1/2 top-1/2 z-50 w-full',
                '-translate-x-1/2 -translate-y-1/2',
                sizeMap[size]
              )}
            >
              <motion.div
                className={cn(
                  'bg-card rounded-feature border border-border shadow-clay-md',
                  'flex flex-col max-h-[85vh] overflow-hidden'
                )}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {title && (
                  <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                    <DialogPrimitive.Title className="text-feature-title font-semibold text-foreground">
                      {title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Close asChild>
                      <button
                        className="rounded-standard p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </DialogPrimitive.Close>
                  </div>
                )}
                <div className="p-6 overflow-y-auto flex-1">{children}</div>
                {footer && (
                  <div className="flex justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
                    {footer}
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};
