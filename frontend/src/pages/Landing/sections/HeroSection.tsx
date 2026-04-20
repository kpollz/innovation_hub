import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aceternity/AuroraBackground';
import { ShimmerButton } from '@/components/ui/aceternity/ShimmerButton';
import { TextGenerateEffect } from '@/components/ui/aceternity/TextGenerateEffect';
import type { User } from '@/types';

interface HeroSectionProps {
  user: User | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ user }) => {
  const { t } = useTranslation();

  return (
    <AuroraBackground
      intensity="medium"
      className="rounded-b-section"
      style={{ background: '#f0f4ff' }}
    >
      <div className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-700 rounded-full text-sm font-medium mb-8"
          >
            <Sparkles className="h-4 w-4" />
            {t('landing.welcome')}
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-display-hero sm:text-display-hero text-foreground font-bold mb-6"
          >
            {t('landing.hero_title')}
          </motion.h1>

          {/* Tagline with text generate */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-body-lg text-slate-600 max-w-2xl mx-auto mb-4 min-h-[2rem]"
          >
            <TextGenerateEffect text={t('landing.hero_tagline')} />
          </motion.div>

          {/* User greeting */}
          {user && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-slate-600 text-body mb-8"
            >
              {t('landing.hello', { name: user.full_name || user.username })}
            </motion.p>
          )}

          {/* CTA Buttons with Clay playful hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <motion.div whileHover={{ rotate: -8, y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Link to="/problems">
                <ShimmerButton>
                  {t('landing.hero_cta_problems')}
                  <ArrowRight className="h-4 w-4" />
                </ShimmerButton>
              </Link>
            </motion.div>
            <motion.div whileHover={{ rotate: -8, y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Link to="/rooms">
                <ShimmerButton variant="outline">
                  {t('landing.hero_cta_ideas')}
                  <ArrowRight className="h-4 w-4" />
                </ShimmerButton>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AuroraBackground>
  );
};
