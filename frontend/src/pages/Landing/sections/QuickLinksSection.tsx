import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export const QuickLinksSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <div className="bg-card border border-border rounded-feature p-6 flex items-center gap-5 hover:shadow-clay transition-shadow duration-300">
        <div className="p-3 bg-primary-50 rounded-feature flex-shrink-0">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-feature-title font-semibold text-foreground">{t('landing.help_card_title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('landing.help_card_desc')}</p>
        </div>
        <Link to="/help">
          <Button variant="secondary" className="gap-2 whitespace-nowrap">
            {t('landing.help_card_cta')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.section>
  );
};
