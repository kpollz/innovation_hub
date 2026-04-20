import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Lightbulb, Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/aceternity/SpotlightCard';
import { Button } from '@/components/ui/Button';

const features = [
  {
    id: 'problems',
    titleKey: 'problem_feed',
    descKey: 'problem_feed_desc',
    bullets: ['problem_feature_1', 'problem_feature_2', 'problem_feature_3'],
    icon: AlertCircle,
    color: 'text-slushie-600',
    bgColor: 'bg-slushie-50',
    dotColor: 'bg-slushie-500',
    link: '/problems',
    ctaKey: 'go_to_problems',
  },
  {
    id: 'ideas',
    titleKey: 'idea_lab',
    descKey: 'idea_lab_desc',
    bullets: ['idea_feature_1', 'idea_feature_2', 'idea_feature_3'],
    icon: Lightbulb,
    color: 'text-lemon-600',
    bgColor: 'bg-lemon-50',
    dotColor: 'bg-lemon-500',
    link: '/rooms',
    ctaKey: 'enter_idea_lab',
  },
  {
    id: 'events',
    titleKey: 'events_feature_title',
    descKey: 'events_feature_desc',
    bullets: ['events_feature_1', 'events_feature_2', 'events_feature_3'],
    icon: Trophy,
    color: 'text-ube-600',
    bgColor: 'bg-ube-50',
    dotColor: 'bg-ube-500',
    link: '/events',
    ctaKey: 'go_to_events',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="mb-16">
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-section-heading font-bold text-foreground mb-3"
        >
          {t('landing.features_heading')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-body text-muted-foreground max-w-xl mx-auto"
        >
          {t('landing.features_subtitle')}
        </motion.p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="grid md:grid-cols-3 gap-6"
      >
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <motion.div key={feature.id} variants={cardVariants}>
              <SpotlightCard className="h-full">
                <div className="p-8 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-standard ${feature.bgColor} flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-feature-title font-bold text-foreground leading-tight">
                      {t(`landing.${feature.titleKey}`)}
                    </h3>
                  </div>

                  <p className="text-muted-foreground text-sm mb-5">
                    {t(`landing.${feature.descKey}`)}
                  </p>

                  <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-1">
                    {feature.bullets.map((bk) => (
                      <li key={bk} className="flex items-start gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${feature.dotColor} flex-shrink-0 mt-1.5`} />
                        <span>{t(`landing.${bk}`)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Clay playful hover on CTA */}
                  <motion.div whileHover={{ rotate: -8, y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <Link to={feature.link}>
                      <Button className="w-full gap-2">
                        {t(`landing.${feature.ctaKey}`)}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
