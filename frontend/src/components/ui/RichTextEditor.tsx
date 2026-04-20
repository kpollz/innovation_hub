import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
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
  /** When true, value is JSON-stringified TipTap content and onChange returns JSON string */
  jsonMode?: boolean;
}

const COLORS = [
  '#000000', '#434343', '#666666', '#999999',
  '#dc2626', '#ea580c', '#d97706', '#ca8a04',
  '#16a34a', '#059669', '#0891b2', '#2563eb',
  '#4f46e5', '#7c3aed', '#a855f7', '#db2777',
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Start writing...',
  minHeight = '200px',
  jsonMode = false,
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

  // In jsonMode, parse JSON string to object for TipTap; otherwise use HTML string
  const initialContent = useMemo(() => {
    if (!value) return '';
    if (jsonMode) {
      try {
        return JSON.parse(value);
      } catch {
        return value; // fallback to HTML string
      }
    }
    return value;
  }, [value, jsonMode]);

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
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (jsonMode) {
        onChange(JSON.stringify(editor.getJSON()));
      } else {
        onChange(editor.getHTML());
      }
    },
  });

  // Sync editor content when value changes externally (e.g. editing an existing idea)
  useEffect(() => {
    if (!editor || !value) return;
    if (jsonMode) {
      try {
        const current = JSON.stringify(editor.getJSON());
        if (current !== value) {
          editor.commands.setContent(JSON.parse(value));
        }
      } catch { /* ignore parse errors */ }
    } else {
      if (editor.getHTML() !== value) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor, jsonMode]);

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
        'p-1.5 rounded hover:bg-muted transition-colors',
        isActive && 'bg-muted text-primary-700'
      )}
    >
      {children}
    </button>
  );

  const Separator = () => <div className="w-px h-6 bg-border mx-1" />;
  const iconSize = 'h-4 w-4';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground/70 mb-1">{label}</label>
      )}
      <div
        className={classNames(
          'border rounded-lg overflow-hidden transition-colors',
          error ? 'border-danger-500' : 'border-border focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500'
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-secondary border-b border-border">
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

          {/* Text color */}
          <div className="relative" ref={colorPickerRef}>
            <ToolbarButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              isActive={showColorPicker}
              title="Text Color"
            >
              <div className="relative">
                <Palette className={iconSize} />
                <span
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-3 rounded-full"
                  style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
                />
              </div>
            </ToolbarButton>
            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1 p-3 bg-card rounded-lg shadow-lg border border-border z-30 w-[184px]">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-8 h-8 rounded-md border-2 border-border hover:border-muted-foreground hover:scale-110 transition-all cursor-pointer"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground/70">
                    <input
                      type="color"
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                      onChange={(e) => {
                        editor.chain().focus().setColor(e.target.value).run();
                        setShowColorPicker(false);
                      }}
                    />
                    Custom
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setShowColorPicker(false);
                    }}
                    className="ml-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground/70 hover:bg-secondary rounded"
                    title="Reset color"
                  >
                    Reset
                  </button>
                </div>
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
