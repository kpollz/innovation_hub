import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle, ChevronDown, ChevronRight, Search,
  Rocket, AlertCircle, Lightbulb, Trophy, Bell, Shield, User,
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  key: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  items: FaqItem[];
}

const CATEGORY_META: {
  key: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  { key: 'getting_started', icon: Rocket, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { key: 'problems', icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { key: 'rooms', icon: Lightbulb, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { key: 'events', icon: Trophy, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { key: 'notifications', icon: Bell, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  { key: 'privacy', icon: Shield, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { key: 'profile', icon: User, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
];

const FaqAccordion: React.FC<{
  category: FaqCategory;
  defaultOpen?: boolean;
  searchQuery: string;
}> = ({ category, defaultOpen = false, searchQuery }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const Icon = category.icon;

  const filteredItems = useMemo(() => {
    if (!searchQuery) return category.items;
    const q = searchQuery.toLowerCase();
    return category.items.filter(
      (item) =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [category.items, searchQuery]);

  if (searchQuery && filteredItems.length === 0) return null;

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className={`border ${category.borderColor} rounded-xl overflow-hidden mb-4`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-5 py-4 ${category.bgColor} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${category.color}`} />
          <h3 className={`text-base font-semibold ${category.color}`}>
            {category.title}
          </h3>
          <span className="text-xs text-gray-400 font-normal">
            ({filteredItems.length})
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="divide-y divide-gray-100">
          {filteredItems.map((item, idx) => (
            <div key={idx} className="px-5">
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                className="w-full flex items-start justify-between py-4 text-left gap-3"
              >
                <span className="font-medium text-gray-900 text-sm">
                  {item.q}
                </span>
                {openItems.has(idx) ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
              </button>
              {openItems.has(idx) && (
                <div className="pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const HelpPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const categories: FaqCategory[] = CATEGORY_META.map((meta) => ({
    key: meta.key,
    title: t(`help.${meta.key}.title`),
    icon: meta.icon,
    color: meta.color,
    bgColor: meta.bgColor,
    borderColor: meta.borderColor,
    items: Object.entries(t(`help.${meta.key}`, { returnObjects: true }) as Record<string, unknown>)
      .filter(([k, v]) => k.startsWith('q') && typeof v === 'object' && v !== null)
      .map(([, v]) => v as { q: string; a: string }),
  }));

  const hasResults = categories.some(
    (cat) => !searchQuery || cat.items.length > 0
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary-50 rounded-xl">
            <HelpCircle className="h-6 w-6 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('help.title')}</h1>
        </div>
        <p className="text-gray-600 ml-14">{t('help.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('help.search_placeholder')}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        />
      </div>

      {/* FAQ Categories */}
      {hasResults ? (
        categories.map((cat, idx) => (
          <FaqAccordion
            key={cat.key}
            category={cat}
            defaultOpen={idx === 0 || !!searchQuery}
            searchQuery={searchQuery}
          />
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('help.no_results')}</p>
        </div>
      )}
    </div>
  );
};
