import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, UserPlus, LogOut, Shield, Crown,
  ChevronDown, ChevronUp, AlertTriangle, Loader2, X, Check
} from 'lucide-react';
import { eventsApi } from '@/api/events';
import { useAuthStore } from '@/stores/authStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import type { EventObject, EventTeamObject, EventTeamMemberObject } from '@/types';

interface TeamsTabProps {
  event: EventObject;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({ event }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isActive = event.status === 'active';

  const [teams, setTeams] = useState<EventTeamObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Record<string, EventTeamMemberObject[]>>({});
  const [membersLoading, setMembersLoading] = useState<Record<string, boolean>>({});

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const result = await eventsApi.listTeams(event.id, 1, 100);
      setTeams(result.items);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  // Fetch members for all teams to detect current user's membership
  useEffect(() => {
    if (teams.length === 0) return;
    const fetchAllMembers = async () => {
      for (const team of teams) {
        if (!teamMembers[team.id]) {
          try {
            const result = await eventsApi.listTeamMembers(event.id, team.id);
            setTeamMembers(prev => ({ ...prev, [team.id]: result.items }));
          } catch { /* silent */ }
        }
      }
    };
    fetchAllMembers();
  }, [teams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMembers = useCallback(async (teamId: string) => {
    setMembersLoading(prev => ({ ...prev, [teamId]: true }));
    try {
      const result = await eventsApi.listTeamMembers(event.id, teamId);
      setTeamMembers(prev => ({ ...prev, [teamId]: result.items }));
    } catch {
      // handled silently
    } finally {
      setMembersLoading(prev => ({ ...prev, [teamId]: false }));
    }
  }, [event.id]);

  const toggleExpand = (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(teamId);
      if (!teamMembers[teamId]) {
        fetchMembers(teamId);
      }
    }
  };

  // Detect current user's team membership
  const getMyMembership = useCallback((): { team: EventTeamObject; member?: EventTeamMemberObject } | null => {
    for (const team of teams) {
      if (team.leader_id === user?.id) {
        return { team };
      }
      const members = teamMembers[team.id];
      if (members) {
        const myMember = members.find(m => m.user_id === user?.id && m.status === 'active');
        if (myMember) return { team, member: myMember };
      }
    }
    return null;
  }, [teams, teamMembers, user?.id]);

  const getMyPending = useCallback((): { team: EventTeamObject; member: EventTeamMemberObject } | null => {
    for (const team of teams) {
      const members = teamMembers[team.id];
      if (members) {
        const pending = members.find(m => m.user_id === user?.id && m.status === 'pending');
        if (pending) return { team, member: pending };
      }
    }
    // Fallback: check if user is leader of any team (leaders are auto active members)
    for (const team of teams) {
      if (team.leader_id === user?.id) return null; // already handled above
    }
    return null;
  }, [teams, teamMembers, user?.id]);

  const myMembership = getMyMembership();
  const myPending = getMyPending();

  const canCreateTeam = isActive && !myMembership && !myPending;
  const canJoinTeam = isActive && !myMembership && !myPending;
  const canLeaveTeam = isActive && myMembership && myMembership.team.leader_id !== user?.id;

  // --- Create Team ---
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlogan, setCreateSlogan] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateTeam = async () => {
    if (!createName.trim() || createName.trim().length < 2) return;
    setCreating(true);
    try {
      await eventsApi.createTeam(event.id, {
        name: createName.trim(),
        slogan: createSlogan.trim() || undefined,
      });
      setShowCreate(false);
      setCreateName('');
      setCreateSlogan('');
      await fetchTeams();
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.teams.create_error'));
    } finally {
      setCreating(false);
    }
  };

  // --- Join Team ---
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);

  const handleJoinTeam = async (teamId: string) => {
    setJoiningTeamId(teamId);
    try {
      await eventsApi.joinTeam(event.id, teamId);
      await fetchTeams();
      // Also refresh members for this team if expanded
      if (expandedTeamId === teamId) {
        await fetchMembers(teamId);
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.teams.join_error'));
    } finally {
      setJoiningTeamId(null);
    }
  };

  // --- Leave Team ---
  const [showLeave, setShowLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleLeaveTeam = async () => {
    if (!myMembership) return;
    setLeaving(true);
    try {
      await eventsApi.leaveTeam(event.id, myMembership.team.id);
      setShowLeave(false);
      await fetchTeams();
      setExpandedTeamId(null);
      setTeamMembers({});
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.teams.leave_error'));
    } finally {
      setLeaving(false);
    }
  };

  // --- Disband Team ---
  const [showDisband, setShowDisband] = useState(false);
  const [disbanding, setDisbanding] = useState(false);

  const handleDisbandTeam = async () => {
    if (!myMembership) return;
    setDisbanding(true);
    try {
      await eventsApi.disbandTeam(event.id, myMembership.team.id);
      setShowDisband(false);
      await fetchTeams();
      setExpandedTeamId(null);
      setTeamMembers({});
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.teams.disband_error'));
    } finally {
      setDisbanding(false);
    }
  };

  // --- Transfer Lead ---
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferToId, setTransferToId] = useState('');
  const [transferring, setTransferring] = useState(false);

  const handleTransferLead = async () => {
    if (!myMembership || !transferToId) return;
    setTransferring(true);
    try {
      await eventsApi.transferLead(event.id, myMembership.team.id, { new_leader_id: transferToId });
      setShowTransfer(false);
      setTransferToId('');
      await fetchTeams();
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.teams.transfer_error'));
    } finally {
      setTransferring(false);
    }
  };

  // --- Approve/Reject ---
  const [actioningMemberId, setActioningMemberId] = useState<string | null>(null);

  const handleMemberAction = async (teamId: string, userId: string, newStatus: 'active' | 'rejected') => {
    setActioningMemberId(userId);
    try {
      await eventsApi.updateMemberStatus(event.id, teamId, userId, { status: newStatus });
      await fetchTeams();
      await fetchMembers(teamId);
    } catch (err: any) {
      alert(err?.response?.data?.detail || t('events.teams.action_error'));
    } finally {
      setActioningMemberId(null);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('events.teams.title', { count: teams.length })}
        </h2>
        {canCreateTeam && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            {t('events.teams.create')}
          </button>
        )}
      </div>

      {/* Already in a team notice */}
      {myMembership && (
        <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 flex-shrink-0" />
            {myMembership.team.leader_id === user?.id
              ? t('events.teams.you_are_leader', { name: myMembership.team.name })
              : t('events.teams.you_are_member', { name: myMembership.team.name })
            }
          </div>
          <div className="flex gap-2">
            {canLeaveTeam && (
              <button
                onClick={() => setShowLeave(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
              >
                <LogOut className="h-3 w-3" />
                {t('events.teams.leave')}
              </button>
            )}
            {myMembership.team.leader_id === user?.id && isActive && (
              <>
                <button
                  onClick={() => setShowTransfer(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                >
                  <Crown className="h-3 w-3" />
                  {t('events.teams.transfer_lead')}
                </button>
                <button
                  onClick={() => setShowDisband(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {t('events.teams.disband')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending join request notice */}
      {myPending && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
          {t('events.teams.pending_request', { name: myPending.team.name })}
        </div>
      )}

      {/* Empty state */}
      {teams.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600">{t('events.teams.no_teams')}</h3>
          <p className="text-gray-400 mt-1">{t('events.teams.no_teams_desc')}</p>
          {canCreateTeam && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {t('events.teams.create_first')}
            </button>
          )}
        </div>
      )}

      {/* Team Cards */}
      {teams.map(team => {
        const isMyTeam = myMembership?.team?.id === team.id;
        const isLeader = team.leader_id === user?.id;
        const isExpanded = expandedTeamId === team.id;
        const isJoining = joiningTeamId === team.id;
        const members = teamMembers[team.id] || [];
        const pendingMembers = members.filter(m => m.status === 'pending');
        const isLoadingMembers = membersLoading[team.id];

        return (
          <div
            key={team.id}
            className={`bg-white rounded-lg border transition-colors ${
              isMyTeam ? 'border-primary-300 ring-1 ring-primary-100' : 'border-gray-200'
            }`}
          >
            {/* Team Header */}
            <button
              onClick={() => toggleExpand(team.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{team.name}</h3>
                    {isMyTeam && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap">
                        {isLeader ? t('events.teams.leader_badge') : t('events.teams.member_badge')}
                      </span>
                    )}
                    {pendingMembers.length > 0 && isLeader && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        {pendingMembers.length} {t('events.teams.pending')}
                      </span>
                    )}
                  </div>
                  {team.slogan && (
                    <p className="text-sm text-gray-500 truncate">{team.slogan}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{t('events.teams.member_count', { count: team.member_count })}</span>
                  <span>{t('events.teams.idea_count', { count: team.idea_count })}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-5 space-y-4">
                {/* Leader info */}
                {team.leader && (
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-600">{t('events.teams.leader')}:</span>
                    <div className="flex items-center gap-1.5">
                      <Avatar src={team.leader.avatar_url} name={team.leader.full_name || team.leader.username} size="sm" />
                      <span className="font-medium text-gray-900">
                        {team.leader.full_name || team.leader.username}
                      </span>
                    </div>
                  </div>
                )}

                {/* Assigned review info */}
                {team.assigned_to_team && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-indigo-500" />
                    <span className="text-gray-600">{t('events.teams.reviews_team')}:</span>
                    <span className="font-medium text-gray-900">{team.assigned_to_team.name}</span>
                  </div>
                )}

                {/* Members loading */}
                {isLoadingMembers && (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">{t('common.loading')}</span>
                  </div>
                )}

                {/* Members list */}
                {!isLoadingMembers && members.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">{t('events.teams.members')}</h4>
                    <div className="space-y-1.5">
                      {members.map(member => (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg ${
                            member.status === 'pending' ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar src={member.user?.avatar_url} name={member.user?.full_name || member.user?.username} size="sm" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {member.user?.full_name || member.user?.username || '...'}
                              </span>
                              {member.user_id === team.leader_id && (
                                <span className="ml-2 text-xs text-yellow-600">
                                  <Crown className="h-3 w-3 inline" /> {t('events.teams.leader')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.status === 'pending' && (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                                {t('events.teams.status_pending')}
                              </span>
                            )}
                            {/* Approve/Reject buttons for leader */}
                            {member.status === 'pending' && (isLeader || isAdmin) && isActive && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleMemberAction(team.id, member.user_id, 'active')}
                                  disabled={!!actioningMemberId}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                                  title={t('events.teams.approve')}
                                >
                                  {actioningMemberId === member.user_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleMemberAction(team.id, member.user_id, 'rejected')}
                                  disabled={!!actioningMemberId}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                                  title={t('events.teams.reject')}
                                >
                                  {actioningMemberId === member.user_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No members shown yet */}
                {!isLoadingMembers && members.length === 0 && (
                  <p className="text-sm text-gray-400">{t('events.teams.no_members')}</p>
                )}

                {/* Action buttons for non-members */}
                {canJoinTeam && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleJoinTeam(team.id)}
                      disabled={!!joiningTeamId}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {isJoining ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      {t('events.teams.join')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* --- Create Team Modal --- */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('events.teams.create_title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleCreateTeam}
              disabled={!createName.trim() || createName.trim().length < 2 || creating}
            >
              {creating ? t('common.creating') : t('events.teams.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('events.teams.name_label')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              placeholder={t('events.teams.name_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              maxLength={100}
              autoFocus
            />
            {createName.trim().length > 0 && createName.trim().length < 2 && (
              <p className="text-red-500 text-xs mt-1">{t('events.teams.name_min')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('events.teams.slogan_label')}
            </label>
            <input
              type="text"
              value={createSlogan}
              onChange={e => setCreateSlogan(e.target.value)}
              placeholder={t('events.teams.slogan_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              maxLength={255}
            />
          </div>
          <p className="text-xs text-gray-500">{t('events.teams.create_notice')}</p>
        </div>
      </Modal>

      {/* --- Leave Team Confirmation --- */}
      <Modal
        isOpen={showLeave}
        onClose={() => setShowLeave(false)}
        title={t('events.teams.leave_title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLeave(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={handleLeaveTeam} disabled={leaving}>
              {leaving ? t('common.loading') : t('events.teams.leave')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">{t('events.teams.leave_confirm')}</p>
      </Modal>

      {/* --- Disband Team Confirmation --- */}
      <Modal
        isOpen={showDisband}
        onClose={() => setShowDisband(false)}
        title={t('events.teams.disband_title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDisband(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={handleDisbandTeam} disabled={disbanding}>
              {disbanding ? t('common.loading') : t('events.teams.disband')}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">{t('events.teams.disband_confirm')}</p>
            <p className="text-xs text-gray-500 mt-2">{t('events.teams.disband_warning')}</p>
          </div>
        </div>
      </Modal>

      {/* --- Transfer Lead Modal --- */}
      <Modal
        isOpen={showTransfer}
        onClose={() => { setShowTransfer(false); setTransferToId(''); }}
        title={t('events.teams.transfer_title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowTransfer(false); setTransferToId(''); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleTransferLead} disabled={!transferToId || transferring}>
              {transferring ? t('common.loading') : t('events.teams.transfer_confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-3">{t('events.teams.transfer_desc')}</p>
        <select
          value={transferToId}
          onChange={e => setTransferToId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        >
          <option value="">{t('events.teams.select_member')}</option>
          {myMembership && teamMembers[myMembership.team.id]
            ?.filter(m => m.status === 'active' && m.user_id !== user?.id)
            .map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.user?.full_name || m.user?.username || m.user_id}
              </option>
            ))
          }
        </select>
      </Modal>
    </div>
  );
};
