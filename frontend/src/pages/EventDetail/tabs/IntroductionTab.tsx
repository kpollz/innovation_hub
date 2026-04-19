import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { TipTapRenderer } from '@/components/ui/TipTapRenderer';
import type { EventObject } from '@/types';

interface IntroductionTabProps {
  event: EventObject;
}

export const IntroductionTab: React.FC<IntroductionTabProps> = ({ event }) => {
  const { t } = useTranslation();

  if (event.introduction_type === 'embed' && event.embed_url) {
    return (
      <div className="w-full">
        <iframe
          src={event.embed_url}
          title="Event Introduction"
          className="w-full border border-gray-200 rounded-lg"
          style={{ minHeight: '500px' }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    );
  }

  if (event.introduction_type === 'editor' && event.description) {
    const desc = typeof event.description === 'string'
      ? (() => { try { return JSON.parse(event.description); } catch { return event.description; } })()
      : event.description;
    return <TipTapRenderer content={desc} className="p-4" />;
  }

  return (
    <div className="text-center py-16">
      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-gray-600">{t('events.introduction.no_content')}</h3>
      <p className="text-gray-400 mt-1">{t('events.introduction.no_content_desc')}</p>
    </div>
  );
};
