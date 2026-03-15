import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { useProblemStore } from '@/stores/problemStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProblemCard } from '@/components/common/ProblemCard';
import { PROBLEM_CATEGORIES, PROBLEM_STATUSES } from '@/utils/constants';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most_liked', label: 'Most Liked' },
  { value: 'most_commented', label: 'Most Commented' },
];

export const ProblemFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    problems, 
    totalProblems, 
    currentPage, 
    totalPages, 
    filters, 
    isLoading, 
    fetchProblems, 
    setFilters 
  } = useProblemStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchQuery, page: 1 });
    fetchProblems({ ...filters, search: searchQuery, page: 1 });
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { [key]: value === '' ? undefined : value, page: 1 };
    setFilters(newFilters);
    fetchProblems({ ...filters, ...newFilters });
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
    fetchProblems({ ...filters, page });
  };

  const handleCreateProblem = () => {
    navigate('/problems/new');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Problem Feed</h1>
          <p className="text-gray-600 mt-1">
            {totalProblems} problems shared by the community
          </p>
        </div>
        <Button onClick={handleCreateProblem} leftIcon={<Plus className="h-4 w-4" />}>
          Share Problem
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <Select
              label="Category"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              options={[{ value: '', label: 'All Categories' }, ...PROBLEM_CATEGORIES]}
            />
            <Select
              label="Status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[{ value: '', label: 'All Statuses' }, ...PROBLEM_STATUSES]}
            />
            <Select
              label="Sort By"
              value={filters.sort_by || 'newest'}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              options={sortOptions}
            />
          </div>
        )}
      </div>

      {/* Problems List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No problems found</p>
          <Button variant="secondary" className="mt-4" onClick={handleCreateProblem}>
            Share the first problem
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};