import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, User, BookOpen } from 'lucide-react';
import { useProblemStore } from '@/stores/problemStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { ProblemCard } from '@/components/common/ProblemCard';
import { PROBLEM_CATEGORIES, PROBLEM_STATUSES } from '@/utils/constants';

export const ProblemFeedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
  const [showMyProblems, setShowMyProblems] = useState(false);

  const sortOptions = [
    { value: 'newest', label: t('problems.newest') },
    { value: 'oldest', label: t('problems.oldest') },
    { value: 'most_liked', label: t('problems.most_liked') },
    { value: 'most_commented', label: t('problems.most_commented') },
  ];

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

  const toggleMyProblems = () => {
    const next = !showMyProblems;
    setShowMyProblems(next);
    const authorId = next && user ? user.id : undefined;
    setFilters({ author_id: authorId, page: 1 });
    fetchProblems({ ...filters, author_id: authorId, page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-section-heading font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary-600" />
            {t('problems.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('problems.count', { count: totalProblems })}
          </p>
        </div>
        <Button onClick={() => navigate('/problems/new')} leftIcon={<Plus className="h-4 w-4" />}>
          {t('problems.share_problem')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-border space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('problems.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            {t('common.search')}
          </Button>
          <Button
            type="button"
            variant={showMyProblems ? 'primary' : 'ghost'}
            onClick={toggleMyProblems}
            leftIcon={<User className="h-4 w-4" />}
          >
            {t('problems.my_problems')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            {t('problems.filters')}
          </Button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-border">
            <Select
              label={t('problems.category')}
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              options={[{ value: '', label: t('problems.all_categories') }, ...PROBLEM_CATEGORIES]}
            />
            <Select
              label={t('problems.status')}
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[{ value: '', label: t('problems.all_statuses') }, ...PROBLEM_STATUSES]}
            />
            <Select
              label={t('problems.sort_by')}
              value={filters.sort || 'newest'}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              options={sortOptions}
            />
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-foreground/70 mb-1">{t('common.date_range')}</label>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={filters.date_from || ''}
                  onChange={(val) => handleFilterChange('date_from', val)}
                  max={filters.date_to || undefined}
                  placeholder={t('common.date_from')}
                  className="flex-1"
                />
                <span className="text-muted-foreground shrink-0">→</span>
                <DatePicker
                  value={filters.date_to || ''}
                  onChange={(val) => handleFilterChange('date_to', val)}
                  min={filters.date_from || undefined}
                  placeholder={t('common.date_to')}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Problems List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <p className="text-muted-foreground">{t('problems.no_problems')}</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/problems/new')}>
            {t('problems.share_first')}
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
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('common.page_of', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
};
