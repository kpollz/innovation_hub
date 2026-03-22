import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          {t('landing.welcome')}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('landing.hero_title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          {t('landing.hero_desc')}{' '}
          {t('landing.hello', { name: user?.full_name || user?.username })} 👋
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Problem Feed Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-warning-100 rounded-xl">
              <AlertCircle className="h-8 w-8 text-warning-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('landing.problem_feed')}</h2>
          </div>
          <p className="text-gray-600 mb-6">
            {t('landing.problem_feed_desc')}
          </p>
          <ul className="text-sm text-gray-500 space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              {t('landing.problem_feature_1')}
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              {t('landing.problem_feature_2')}
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              {t('landing.problem_feature_3')}
            </li>
          </ul>
          <Link to="/problems">
            <Button className="w-full gap-2">
              {t('landing.go_to_problems')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Idea Lab Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Lightbulb className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('landing.idea_lab')}</h2>
          </div>
          <p className="text-gray-600 mb-6">
            {t('landing.idea_lab_desc')}
          </p>
          <ul className="text-sm text-gray-500 space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              {t('landing.idea_feature_1')}
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              {t('landing.idea_feature_2')}
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              {t('landing.idea_feature_3')}
            </li>
          </ul>
          <Link to="/rooms">
            <Button variant="secondary" className="w-full gap-2">
              {t('landing.enter_idea_lab')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <h3 className="text-lg font-semibold mb-4 text-center">{t('landing.ready_to_innovate')}</h3>
        <p className="text-primary-100 text-center max-w-xl mx-auto">
          {t('landing.ready_desc')}
        </p>
      </div>
    </div>
  );
};