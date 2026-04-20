import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aceternity/AuroraBackground';
import { ShimmerButton } from '@/components/ui/aceternity/ShimmerButton';

export const CTASection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AuroraBackground
      intensity="subtle"
      className="rounded-t-section"
      style={{ background: '#f0f4ff' }}
    >
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-section-heading font-bold text-foreground mb-4">
            {t('landing.cta_heading')}
          </h3>
          <p className="text-body text-slate-600 max-w-xl mx-auto mb-8">
            {t('landing.cta_desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ rotate: -8, y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Link to="/problems">
                <ShimmerButton>
                  {t('landing.hero_cta_problems')}
                  <ArrowRight className="h-4 w-4" />
                </ShimmerButton>
              </Link>
            </motion.div>
            <motion.div whileHover={{ rotate: -8, y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Link to="/help">
                <ShimmerButton variant="outline">
                  {t('landing.cta_guide')}
                  <ArrowRight className="h-4 w-4" />
                </ShimmerButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </AuroraBackground>
  );
};
