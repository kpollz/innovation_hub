import React, { useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link as LinkExtension } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { ResizableImage } from './ResizableImageExtension';
import type { TipTapContent } from '@/types';

interface TipTapRendererProps {
  content: TipTapContent | null | undefined;
  className?: string;
}

export const TipTapRenderer: React.FC<TipTapRendererProps> = ({ content, className = '' }) => {
  // TipTap's content prop accepts HTML strings or JSON objects directly
  const parsedContent = useMemo(() => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    // It's a JSON object — TipTap accepts it directly
    return content;
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage,
      LinkExtension.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary-600 underline hover:text-primary-800 cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: parsedContent,
    editable: false,
    immediatelyRender: false,
  });

  if (!content) return null;
  if (!editor) return null;

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <EditorContent editor={editor} />
    </div>
  );
};
