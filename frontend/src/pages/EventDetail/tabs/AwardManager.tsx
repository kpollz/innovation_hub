import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, UserPlus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { eventsApi } from '@/api/events';
import { useUIStore } from '@/stores/uiStore';
import type { EventObject, EventDashboardTeam, EventAward } from '@/types';

interface AwardManagerProps {
  event: EventObject;
  teams: EventDashboardTeam[];
  onClose: () => void;
  onChanged: () => void;
}

export const AwardManager: React.FC<AwardManagerProps> = ({
  event, teams, onClose, onChanged,
}) => {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);

  const [awards, setAwards] = useState<EventAward[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingAward, setEditingAward] = useState<EventAward | null>(null);
  const [formName, setFormName] = useState('');
  const [formRank, setFormRank] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Team assignment
  const [assigningAwardId, setAssigningAwardId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const fetchAwards = useCallback(async () => {
    try {
      const res = await eventsApi.getAwards(event.id);
      setAwards(res.items);
    } catch {
      showToast({ type: 'error', message: t('events.dashboard.award_error') });
    } finally {
      setLoading(false);
    }
  }, [event.id, showToast, t]);

  useEffect(() => { fetchAwards(); }, [fetchAwards]);

  const getAssignedTeamIds = useCallback(() => {
    const ids = new Set<string>();
    awards.forEach((a) => a.teams.forEach((at) => ids.add(at.team_id)));
    return ids;
  }, [awards]);

  const handleCreate = () => {
    setEditingAward(null);
    setFormName('');
    setFormRank(awards.length + 1);
    setShowForm(true);
  };

  const handleEdit = (award: EventAward) => {
    setEditingAward(award);
    setFormName(award.name);
    setFormRank(award.rank_order);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (editingAward) {
        await eventsApi.updateAward(event.id, editingAward.id, {
          name: formName,
          rank_order: formRank,
        });
        showToast({ type: 'success', message: t('events.dashboard.award_updated') });
      } else {
        await eventsApi.createAward(event.id, {
          name: formName,
          rank_order: formRank,
        });
        showToast({ type: 'success', message: t('events.dashboard.award_created') });
      }
      setShowForm(false);
      setLoading(true);
      await fetchAwards();
      onChanged();
    } catch {
      showToast({ type: 'error', message: t('events.dashboard.award_error') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (awardId: string) => {
    try {
      await eventsApi.deleteAward(event.id, awardId);
      showToast({ type: 'success', message: t('events.dashboard.award_deleted') });
      setDeletingId(null);
      setLoading(true);
      await fetchAwards();
      onChanged();
    } catch {
      showToast({ type: 'error', message: t('events.dashboard.award_error') });
    }
  };

  const handleAddTeam = async () => {
    if (!assigningAwardId || !selectedTeamId) return;
    try {
      await eventsApi.addTeamToAward(event.id, assigningAwardId, selectedTeamId);
      showToast({ type: 'success', message: t('events.dashboard.team_assigned') });
      setSelectedTeamId('');
      setAssigningAwardId(null);
      setLoading(true);
      await fetchAwards();
      onChanged();
    } catch {
      showToast({ type: 'error', message: t('events.dashboard.award_error') });
    }
  };

  const handleRemoveTeam = async (awardId: string, teamId: string) => {
    try {
      await eventsApi.removeTeamFromAward(event.id, awardId, teamId);
      showToast({ type: 'success', message: t('events.dashboard.team_removed') });
      setLoading(true);
      await fetchAwards();
      onChanged();
    } catch {
      showToast({ type: 'error', message: t('events.dashboard.award_error') });
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t('events.dashboard.manage_awards')} size="lg">
      {/* Create Award button */}
      <div className="mb-4">
        <Button onClick={handleCreate} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          {t('events.dashboard.create_award')}
        </Button>
      </div>

      {/* Awards list */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      ) : awards.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          {t('events.dashboard.no_awards')}
        </p>
      ) : (
        <div className="space-y-3">
          {awards.map((award) => (
            <div key={award.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-foreground">{award.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    #{award.rank_order}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setAssigningAwardId(assigningAwardId === award.id ? null : award.id)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-standard transition-colors"
                    title={t('events.dashboard.assign_teams')}
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(award)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-standard transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(award.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-standard transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Assigned teams */}
              {award.teams.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {award.teams.map((at) => (
                    <span
                      key={at.team_id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-standard text-xs"
                    >
                      <Avatar src={at.leader_avatar_url} name={at.leader_name || at.team_name} size="xs" />
                      <span className="font-medium">{at.team_name}</span>
                      <button
                        onClick={() => handleRemoveTeam(award.id, at.team_id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Team assignment dropdown */}
              {assigningAwardId === award.id && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="flex-1 text-sm border border-border rounded-standard px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('events.dashboard.select_team')}</option>
                    {teams
                      .filter((dt) => !getAssignedTeamIds().has(dt.team.id) || award.teams.some((at) => at.team_id === dt.team.id))
                      .map((dt) => (
                        <option key={dt.team.id} value={dt.team.id}>
                          {dt.team.name}
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleAddTeam}
                    disabled={!selectedTeamId}
                  >
                    {t('events.dashboard.add_team')}
                  </Button>
                </div>
              )}

              {/* Delete confirmation */}
              {deletingId === award.id && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-100">
                  <p className="text-xs text-red-600 flex-1">
                    {t('events.dashboard.delete_award_confirm')}
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => setDeletingId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleDelete(award.id)}>
                    {t('events.dashboard.delete_award')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingAward ? t('events.dashboard.edit_award') : t('events.dashboard.create_award')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !formName.trim()}>
              {submitting ? '...' : (editingAward ? t('events.dashboard.edit_award') : t('events.dashboard.create_award'))}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('events.dashboard.award_name')}
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full border border-border rounded-standard px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              placeholder={t('events.dashboard.award_name')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('events.dashboard.award_rank')}
            </label>
            <input
              type="number"
              min={1}
              value={formRank}
              onChange={(e) => setFormRank(parseInt(e.target.value) || 1)}
              className="w-full border border-border rounded-standard px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>
    </Modal>
  );
};
