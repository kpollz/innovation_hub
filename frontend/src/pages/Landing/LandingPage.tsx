import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { HeroSection } from './sections/HeroSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { QuickLinksSection } from './sections/QuickLinksSection';
import { CTASection } from './sections/CTASection';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <HeroSection user={user} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FeaturesSection />
        <QuickLinksSection />
      </div>
      <CTASection />
    </div>
  );
};
