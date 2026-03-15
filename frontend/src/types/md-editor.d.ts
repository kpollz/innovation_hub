declare module '@uiw/react-md-editor' {
  import { ComponentType } from 'react';

  export interface MDEditorProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    preview?: 'edit' | 'live' | 'preview';
    height?: number;
    visibleDragbar?: boolean;
  }

  const MDEditor: ComponentType<MDEditorProps> & {
    Markdown: ComponentType<{ source: string }>;
  };

  export default MDEditor;
}