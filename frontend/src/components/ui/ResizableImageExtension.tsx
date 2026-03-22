import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';

/* ── Extend TipTap commands interface ── */
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

/* ── React component rendered inside the editor ── */

const ResizableImageView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  deleteNode,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startInfo = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const { src, alt, width, height, align } = node.attrs;

  useEffect(() => {
    if (selected) setIsSelected(true);
  }, [selected]);

  // Click outside to deselect
  useEffect(() => {
    if (!isSelected) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as HTMLElement)) {
        setIsSelected(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSelected]);

  /* ── Drag-to-resize logic ── */
  const onResizeStart = useCallback(
    (e: React.MouseEvent, corner: 'tl' | 'tr' | 'bl' | 'br') => {
      e.preventDefault();
      e.stopPropagation();
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      startInfo.current = { x: e.clientX, y: e.clientY, width: rect.width, height: rect.height };
      setIsResizing(true);

      // Left corners: dragging left = bigger, right = smaller (invert dx)
      const invertX = corner === 'tl' || corner === 'bl';

      const onMove = (ev: MouseEvent) => {
        const rawDx = ev.clientX - startInfo.current.x;
        const dx = invertX ? -rawDx : rawDx;
        const newWidth = Math.max(50, startInfo.current.width + dx);
        const aspect = startInfo.current.height / startInfo.current.width;
        updateAttributes({ width: Math.round(newWidth), height: Math.round(newWidth * aspect) });
      };

      const onUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [updateAttributes],
  );

  const wrapperStyle: React.CSSProperties = {};
  if (align === 'center') {
    wrapperStyle.display = 'flex';
    wrapperStyle.justifyContent = 'center';
  } else if (align === 'right') {
    wrapperStyle.display = 'flex';
    wrapperStyle.justifyContent = 'flex-end';
  }

  return (
    <NodeViewWrapper style={wrapperStyle}>
      <div
        ref={wrapperRef}
        className="relative inline-block"
        style={{ width: width ? `${width}px` : undefined }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          width={width || undefined}
          height={height || undefined}
          onClick={() => setIsSelected(true)}
          draggable={false}
          className="block max-w-full rounded-lg"
          style={{
            cursor: 'pointer',
            outline: isSelected ? '2px solid #2563eb' : 'none',
            outlineOffset: '2px',
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : 'auto',
          }}
        />

        {/* Resize handles & toolbar when selected */}
        {isSelected && (
          <>
            {/* Top-left */}
            <div
              onMouseDown={(e) => onResizeStart(e, 'tl')}
              style={{
                position: 'absolute', left: -4, top: -4,
                width: 12, height: 12, background: '#2563eb',
                borderRadius: 2, cursor: 'nwse-resize', zIndex: 10,
              }}
            />
            {/* Top-right */}
            <div
              onMouseDown={(e) => onResizeStart(e, 'tr')}
              style={{
                position: 'absolute', right: -4, top: -4,
                width: 12, height: 12, background: '#2563eb',
                borderRadius: 2, cursor: 'nesw-resize', zIndex: 10,
              }}
            />
            {/* Bottom-left */}
            <div
              onMouseDown={(e) => onResizeStart(e, 'bl')}
              style={{
                position: 'absolute', left: -4, bottom: -4,
                width: 12, height: 12, background: '#2563eb',
                borderRadius: 2, cursor: 'nesw-resize', zIndex: 10,
              }}
            />
            {/* Bottom-right */}
            <div
              onMouseDown={(e) => onResizeStart(e, 'br')}
              style={{
                position: 'absolute', right: -4, bottom: -4,
                width: 12, height: 12, background: '#2563eb',
                borderRadius: 2, cursor: 'nwse-resize', zIndex: 10,
              }}
            />

            {/* Floating toolbar above image */}
            <div style={{
              position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 2, padding: '4px 6px',
              background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.15)',
              border: '1px solid #e5e7eb', zIndex: 20,
            }}>
              <ToolBtn active={align === 'left' || !align} onClick={() => updateAttributes({ align: 'left' })} title="Align Left">
                <AlignLeft size={14} />
              </ToolBtn>
              <ToolBtn active={align === 'center'} onClick={() => updateAttributes({ align: 'center' })} title="Center">
                <AlignCenter size={14} />
              </ToolBtn>
              <ToolBtn active={align === 'right'} onClick={() => updateAttributes({ align: 'right' })} title="Align Right">
                <AlignRight size={14} />
              </ToolBtn>
              <div style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />
              <ToolBtn onClick={deleteNode} title="Delete Image">
                <Trash2 size={14} color="#dc2626" />
              </ToolBtn>
            </div>

            {/* Size indicator while resizing */}
            {isResizing && (
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                padding: '2px 6px', background: 'rgba(0,0,0,.7)',
                color: '#fff', fontSize: 11, borderRadius: 4, zIndex: 20,
              }}>
                {width} × {height}
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

/* ── Small toolbar button ── */
const ToolBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    title={title}
    style={{
      padding: 4, borderRadius: 4, border: 'none',
      background: active ? '#dbeafe' : 'transparent',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
    }}
    onMouseOver={(e) => { (e.currentTarget.style.background = active ? '#bfdbfe' : '#f3f4f6'); }}
    onMouseOut={(e) => { (e.currentTarget.style.background = active ? '#dbeafe' : 'transparent'); }}
  >
    {children}
  </button>
);

/* ── TipTap extension ── */
export const ResizableImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
      align: { default: 'left' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { align, width, height, ...rest } = HTMLAttributes;
    const style: string[] = [];
    if (width) style.push(`width: ${width}px`);
    if (height) style.push(`height: ${height}px`);
    if (align === 'center') style.push('display: block', 'margin-left: auto', 'margin-right: auto');
    else if (align === 'right') style.push('display: block', 'margin-left: auto');
    return ['img', mergeAttributes(rest, style.length ? { style: style.join('; ') } : {})];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({ type: this.name, attrs: options });
      },
    };
  },
});
