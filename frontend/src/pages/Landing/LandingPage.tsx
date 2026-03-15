import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          Welcome to Innovation Hub
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Where Ideas Meet Solutions
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Share your problems, collaborate on ideas, and drive innovation together.
          Hello, <span className="font-semibold text-primary-600">{user?.full_name || user?.username}</span>! 👋
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
            <h2 className="text-2xl font-bold text-gray-900">Problem Feed</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Browse and share problems that need solutions. Every great innovation starts with identifying a problem.
          </p>
          <ul className="text-sm text-gray-500 space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Share challenges you're facing
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Explore problems from other teams
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Comment and collaborate on solutions
            </li>
          </ul>
          <Link to="/problems">
            <Button className="w-full gap-2">
              Go to Problem Feed
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
            <h2 className="text-2xl font-bold text-gray-900">Idea Lab</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Brainstorm and develop ideas in collaborative rooms. Vote on the best solutions and bring them to life.
          </p>
          <ul className="text-sm text-gray-500 space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Create or join brainstorming rooms
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Submit and vote on ideas
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Collaborate to refine solutions
            </li>
          </ul>
          <Link to="/rooms">
            <Button variant="secondary" className="w-full gap-2">
              Enter Idea Lab
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <h3 className="text-lg font-semibold mb-4 text-center">Ready to innovate?</h3>
        <p className="text-primary-100 text-center max-w-xl mx-auto">
          Start by exploring existing problems or jump into an idea room to collaborate with your colleagues.
          Your next breakthrough could be just one idea away!
        </p>
      </div>
    </div>
  );
};