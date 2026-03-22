import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link as LinkExtension } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import { ResizableImage } from './ResizableImageExtension';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Minus,
  Palette,
} from 'lucide-react';
import { classNames } from '@/utils/helpers';

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  error?: string;
  placeholder?: string;
  minHeight?: string;
}

const COLORS = [
  '#000000', '#374151', '#6b7280', '#dc2626', '#ea580c',
  '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777',
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Start writing...',
  minHeight = '200px',
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColorPicker]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ResizableImage,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary-600 underline hover:text-primary-800' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={classNames(
        'p-1.5 rounded hover:bg-gray-200 transition-colors',
        isActive && 'bg-gray-200 text-primary-700'
      )}
    >
      {children}
    </button>
  );

  const Separator = () => <div className="w-px h-6 bg-gray-300 mx-1" />;
  const iconSize = 'h-4 w-4';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div
        className={classNames(
          'border rounded-lg overflow-hidden transition-colors',
          error ? 'border-danger-500' : 'border-gray-300 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500'
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <Undo className={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <Redo className={iconSize} />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className={iconSize} />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Code"
          >
            <Code className={iconSize} />
          </ToolbarButton>

          <Separator />

          {/* Text color - click toggle */}
          <div className="relative" ref={colorPickerRef}>
            <ToolbarButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              isActive={showColorPicker}
              title="Text Color"
            >
              <Palette className={iconSize} />
            </ToolbarButton>
            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1 grid grid-cols-5 gap-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-30">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border border-gray-200 text-xs hover:bg-gray-100"
                  title="Reset color"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <Separator />

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className={iconSize} />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className={iconSize} />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={addLink}
            isActive={editor.isActive('link')}
            title="Insert Link"
          >
            <LinkIcon className={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Insert Image">
            <ImageIcon className={iconSize} />
          </ToolbarButton>
        </div>

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-4 py-3"
          style={{ minHeight }}
        />
      </div>
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </div>
  );
};
