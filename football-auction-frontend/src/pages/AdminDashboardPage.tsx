import React, { useState, useEffect } from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { useAuth } from '../contexts/AuthContext';
import type { Phase, Player, User, Team } from '../types';
import { api } from '../services/api';
import { FUTPlayerCard } from '../components/FUTPlayerCard';
import {
  Radio,
  Activity,
  Trophy,
  Settings,
  CheckCircle2,
  ShieldAlert,
  Check,
  X,
  Trash2,
  Calendar,
  AlertTriangle,
  Search,
  Crown,
  Sparkles,
  Sliders,
  Eye,
  Users,
  Shield,
  Plus,
  Play,
  Gavel,
  CheckCircle,
  Hash,
  DollarSign,
  ChevronDown,
  User as UserIcon,
  Palette,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { activePhase, refetchState } = useGlobalPhase();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'MANAGERS' | 'PLAYERS' | 'AUCTION' | 'TOURNAMENT' | 'APPROVALS' | 'SYSTEM'>('MANAGERS');
  const [updating, setUpdating] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Directory States
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState<boolean>(true);

  // Search & Filter States
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [selectedPreviewPlayer, setSelectedPreviewPlayer] = useState<Player | null>(null);
  const [editingRatingPlayerId, setEditingRatingPlayerId] = useState<string | null>(null);
  const [currentEditingRating, setCurrentEditingRating] = useState<number>(80);
  const [savingRating, setSavingRating] = useState<boolean>(false);

  // Team Creation Modal State
  const [showCreateTeamModal, setShowCreateTeamModal] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamCode, setNewTeamCode] = useState<string>('');
  const [newTeamOwnerId, setNewTeamOwnerId] = useState<string>('');
  const [newTeamBudget, setNewTeamBudget] = useState<number>(100000);
  const [newTeamColor, setNewTeamColor] = useState<string>('#8b5cf6');
  const [creatingTeam, setCreatingTeam] = useState<boolean>(false);

  // Nuke Modal State
  const [nukeModalLevel, setNukeModalLevel] = useState<1 | 2 | 3 | null>(null);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [nuking, setNuking] = useState<boolean>(false);

  // Tournament Fixture Generation
  const [isTwoLegged, setIsTwoLegged] = useState<boolean>(false);
  const [generatingFixtures, setGeneratingFixtures] = useState<boolean>(false);

  // Fetch all administrative data
  const loadAdminData = async () => {
    try {
      setLoadingDirectory(true);
      const [usersRes, teamsRes, playersRes] = await Promise.all([
        api.get('/auth/users').catch(() => ({ data: { data: [] } })),
        api.get('/teams').catch(() => ({ data: { data: [] } })),
        api.get('/players').catch(() => ({ data: { data: [] } })),
      ]);

      setAllUsers(usersRes.data.data || []);
      setTeams(teamsRes.data.data || []);
      setPlayers(playersRes.data.data || []);

      if (user?.role === 'SUPER_ADMIN') {
        const pendingRes = await api.get('/auth/pending-users').catch(() => ({ data: { data: [] } }));
        setPendingUsers(pendingRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  // Derived Manager & Podium Admin Lists
  const teamOwners = allUsers.filter((u) => u.role === 'TEAM_OWNER');
  const podiumAdmins = allUsers.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');

  const handleVerifyPlayer = async (playerId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/players/${playerId}/verify`, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Registration parameters unverified' : undefined,
      });
      setMsg(`Player profile ${status.toLowerCase()} successfully`);
      loadAdminData();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Player verification failed');
    }
  };

  const handleSavePlayerRating = async (playerId: string, ratingValue: number) => {
    try {
      setSavingRating(true);
      const res = await api.patch(`/players/${playerId}/rating`, {
        rating: Number(ratingValue),
      });
      const tier = ratingValue >= 88 ? 'ACE' : ratingValue >= 75 ? 'GOLD' : 'SILVER';
      setMsg(`⭐ Player rating updated to ${ratingValue} (${tier} Tier)!`);
      setEditingRatingPlayerId(null);
      loadAdminData();
      if (selectedPreviewPlayer?.id === playerId) {
        setSelectedPreviewPlayer(res.data.data);
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to update rating');
    } finally {
      setSavingRating(false);
    }
  };

  const handleVerifyUser = async (userId: string, approved: boolean) => {
    try {
      await api.patch(`/auth/verify-user/${userId}`, { approved });
      setMsg(`User account registration ${approved ? 'approved' : 'rejected'} successfully`);
      loadAdminData();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'User verification failed');
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetUserName: string) => {
    if (!window.confirm(`Are you sure you want to delete / remove "${targetUserName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setMsg(null);
      const res = await api.delete(`/auth/users/${targetUserId}`);
      setMsg(res.data?.message || `User "${targetUserName}" removed successfully.`);
      loadAdminData();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handlePhaseChange = async (newPhase: Phase) => {
    try {
      setUpdating(true);
      setMsg(null);
      await api.post('/global-state/phase', { phase: newPhase });
      setMsg(`Global Phase successfully updated to ${newPhase}`);
      refetchState();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to update phase');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamCode || !newTeamOwnerId) {
      setMsg('Please fill all required team fields');
      return;
    }
    try {
      setCreatingTeam(true);
      await api.post('/teams', {
        seasonId: 'default-season',
        ownerId: newTeamOwnerId,
        name: newTeamName,
        code: newTeamCode.toUpperCase(),
        allocatedBudget: newTeamBudget,
      });
      setMsg(`🎉 Franchise team "${newTeamName}" created successfully!`);
      setShowCreateTeamModal(false);
      setNewTeamName('');
      setNewTeamCode('');
      setNewTeamOwnerId('');
      loadAdminData();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleGenerateFixtures = async () => {
    try {
      setGeneratingFixtures(true);
      setMsg(null);
      await api.post('/tournaments/default/fixtures', {
        seasonId: 'default-season',
        isTwoLegged,
      });
      setMsg(`🏆 Tournament fixtures (${isTwoLegged ? 'Two-Legged' : 'Single Match'}) arranged and generated successfully!`);
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to generate fixtures');
    } finally {
      setGeneratingFixtures(false);
    }
  };

  const handleExecuteNuke = async () => {
    if (!nukeModalLevel || !adminPassword) return;
    try {
      setNuking(true);
      setMsg(null);
      const endpoint = `/nuke/level${nukeModalLevel}`;
      const res = await api.post(endpoint, { password: adminPassword });
      setMsg(res.data.data?.message || `Level ${nukeModalLevel} reset completed.`);
      setNukeModalLevel(null);
      setAdminPassword('');
      refetchState();
      loadAdminData();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Reset authorization failed');
    } finally {
      setNuking(false);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const name = (p.user?.fullName || p.jerseyName || '').toLowerCase();
    const student = (p.studentId || '').toLowerCase();
    const pos = (p.position || '').toLowerCase();
    const q = playerSearch.toLowerCase();
    return name.includes(q) || student.includes(q) || pos.includes(q);
  });

  const phases: { key: Phase; title: string; desc: string; icon: any }[] = [
    { key: 'SETUP', title: 'Phase 1: Setup', desc: 'Configure season rules, teams, managers & budgets', icon: Settings },
    { key: 'PLAYER_REGISTRATION', title: 'Phase 2: Player Registration', desc: 'Open player submissions, ratings & evaluations', icon: Activity },
    { key: 'LIVE_AUCTION', title: 'Phase 3: Live Auction', desc: 'Enable live bidding podium & real-time broadcast', icon: Radio },
    { key: 'LIVE_TOURNAMENT', title: 'Phase 4: Live Tournament', desc: 'Enable fixtures, match scores & statistics', icon: Trophy },
  ];

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 shadow-lg shadow-purple-900/20">
            <Crown className="w-4 h-4 text-purple-400" />
            {user?.role === 'SUPER_ADMIN' ? 'Super Admin Command Center' : 'Podium Stage Coordinator & Ratings Desk'}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {user?.role === 'SUPER_ADMIN' ? 'League Management &' : 'Auction Stage &'}{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              {user?.role === 'SUPER_ADMIN' ? 'Coordinator' : 'Podium Controller'}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {user?.role === 'SUPER_ADMIN'
              ? 'Arrange live auctions, setup tournaments, manage Team Owners, Podium Admins, and calibrate Player FUT Ratings.'
              : 'Evaluate player FUT Ratings, coordinate live podium lot transitions, and monitor tournament standings.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Phase: <strong className="text-white">{activePhase}</strong>
          </div>
          {user?.role === 'SUPER_ADMIN' && pendingUsers.length > 0 && (
            <button
              onClick={() => setActiveTab('APPROVALS')}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold animate-bounce"
            >
              <AlertTriangle className="w-4 h-4" />
              {pendingUsers.length} Approvals Pending
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-semibold flex items-center justify-between animate-fade-in shadow-lg">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            {msg}
          </span>
          <button onClick={() => setMsg(null)} className="text-purple-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'MANAGERS', label: 'Team & Stage Managers', icon: Users, count: teamOwners.length + podiumAdmins.length },
          { id: 'PLAYERS', label: 'Player Roster & Ratings', icon: Sliders, count: players.length },
          { id: 'AUCTION', label: 'Auction Stage Hub', icon: Gavel },
          { id: 'TOURNAMENT', label: 'Tournament Organizer', icon: Trophy },
          ...(user?.role === 'SUPER_ADMIN'
            ? [
                { id: 'APPROVALS', label: 'User Approvals', icon: ShieldAlert, count: pendingUsers.length },
                { id: 'SYSTEM', label: 'State & Protocols (Nuke)', icon: Settings },
              ]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TEAM MANAGERS & PODIUM MANAGERS */}
      {activeTab === 'MANAGERS' && (
        <div className="space-y-8 animate-fade-in">
          {/* Section 1: Team Managers & Franchises */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-purple-400" />
                  <span>Franchise Team Managers ({teams.length} Teams)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Team owners, allocated purses, squad counts, and real-time financial tracking.
                </p>
              </div>

              {user?.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Franchise
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((t) => {
                const owner = t.owner || teamOwners.find((o) => o.id === t.owner?.id);
                const budget = t.wallet?.allocatedBudget || 100000;
                const spent = t.wallet?.spentAmount || 0;
                const balance = t.wallet?.currentBalance || (budget - spent);
                const squadCount = players.filter((p) => p.teamId === t.id).length;

                return (
                  <div key={t.id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-purple-500/40 transition-all shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg font-black text-purple-300">
                          {t.code}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">{t.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">Code: {t.code}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-800">
                        {squadCount} Players
                      </span>
                    </div>

                    {/* Owner Details */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Team Owner / Manager</span>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>{owner?.fullName || 'Assigned Owner'}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px] block">{owner?.email || 'No email'}</span>
                    </div>

                    {/* Wallet Tracker */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block font-bold">Total Purse</span>
                        <span className="font-mono font-bold text-slate-200">${budget.toLocaleString()}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <span className="text-[10px] uppercase text-emerald-400 block font-bold">Remaining</span>
                        <span className="font-mono font-bold text-emerald-400">${balance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Podium Managers (Admins) */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                <Crown className="w-6 h-6 text-amber-400" />
                <span>Podium Managers & Stage Controllers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Authorized administrators who manage the live auction stage, evaluate player ratings, and execute hammer knocks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podiumAdmins.map((adm) => {
                const isCurrentUser = adm.id === user?.id;
                return (
                  <div
                    key={adm.id}
                    className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-amber-500/40 transition-all relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                          <Crown className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                            <span>{adm.fullName}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/40">
                                You
                              </span>
                            )}
                          </h4>
                          <span className="text-xs text-slate-400 font-mono block mt-0.5">{adm.email}</span>
                        </div>
                      </div>

                      {/* Super Admin Delete / Revoke Stage Controller Button */}
                      {!isCurrentUser && user?.role === 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(adm.id, adm.fullName)}
                          className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 transition-all cursor-pointer shadow-sm"
                          title={`Delete Stage Controller: ${adm.fullName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {adm.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Podium Stage Manager'}
                      </span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Authorized
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYER ROSTER & RATINGS (ACE / GOLD / SILVER) */}
      {activeTab === 'PLAYERS' && (
        <div className="glass-card p-8 rounded-3xl border border-purple-500/40 space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                <Sliders className="w-6 h-6 text-purple-400" />
                <span>Player Ratings, Media & Tier Calibration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Assign player ratings (1-99). The system automatically classifies players into <strong className="text-cyan-300">ACE (88+)</strong>, <strong className="text-amber-300">GOLD (75-87)</strong>, or <strong className="text-slate-300">SILVER (&lt;75)</strong> with live 3D card themes!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search player name, ID..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <span className="text-xs px-3 py-2 rounded-xl bg-purple-900/60 text-purple-300 font-mono font-bold">
                {filteredPlayers.length} Registered
              </span>
            </div>
          </div>

          {/* Tier Legend Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-cyan-500/40 flex items-center justify-between text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50" />
                <span className="font-extrabold text-cyan-300">ACE TIER (88 - 99 OVR)</span>
              </div>
              <span className="font-mono text-slate-200 font-bold">$5,000 Base</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-between text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
                <span className="font-extrabold text-amber-300">GOLD TIER (75 - 87 OVR)</span>
              </div>
              <span className="font-mono text-slate-200 font-bold">$3,000 Base</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-600/40 flex items-center justify-between text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="font-extrabold text-slate-300">SILVER TIER (&lt; 75 OVR)</span>
              </div>
              <span className="font-mono text-slate-200 font-bold">$1,000 Base</span>
            </div>
          </div>

          {/* Players Table */}
          {loadingDirectory ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading registered players...</div>
          ) : filteredPlayers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Player & Photo</th>
                    <th className="py-3.5 px-4 font-semibold">Position</th>
                    <th className="py-3.5 px-4 font-semibold">Rating & Tier</th>
                    <th className="py-3.5 px-4 font-semibold">Base Valuation</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Calibrate Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPlayers.map((p) => {
                    const rating = p.rating !== undefined ? p.rating : 80;
                    const isAce = rating >= 88;
                    const isGold = rating >= 75 && rating < 88;
                    const tierName = isAce ? 'ACE' : isGold ? 'GOLD' : 'SILVER';
                    const baseVal = isAce ? 5000 : isGold ? 3000 : 1000;
                    const isEditing = editingRatingPlayerId === p.id;
                    const photo = p.photoUrl || p.user?.avatarUrl;

                    return (
                      <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex-shrink-0 shadow-md">
                            {photo ? (
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-purple-400">
                                {(p.jerseyName || p.user?.fullName || 'P').substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="block">{p.jerseyName || p.user?.fullName || 'Player'}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ID: {p.studentId || 'N/A'} • {p.academicSession || '2023-2024'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                            {p.position}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                                isAce
                                  ? 'bg-purple-950 text-cyan-300 border-cyan-400/50 shadow-md shadow-purple-900/50'
                                  : isGold
                                  ? 'bg-amber-950 text-amber-300 border-amber-400/50 shadow-md shadow-amber-900/50'
                                  : 'bg-slate-800 text-slate-300 border-slate-600/50'
                              }`}
                            >
                              {rating} OVR
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                isAce
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : isGold
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {tierName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-xs">
                          <div>${baseVal.toLocaleString()}</div>
                          {p.registrationStatus === 'PENDING' && (
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                onClick={() => handleVerifyPlayer(p.id, 'APPROVED')}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyPlayer(p.id, 'REJECTED')}
                                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-[10px] font-bold text-white cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={currentEditingRating}
                                onChange={(e) => setCurrentEditingRating(Number(e.target.value))}
                                className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-purple-500 text-white font-mono text-xs text-center"
                              />
                              <button
                                onClick={() => handleSavePlayerRating(p.id, currentEditingRating)}
                                disabled={savingRating}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRatingPlayerId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSavePlayerRating(p.id, 92)}
                                className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-all cursor-pointer"
                                title="Set as ACE (92 OVR)"
                              >
                                👑 ACE
                              </button>
                              <button
                                onClick={() => handleSavePlayerRating(p.id, 84)}
                                className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition-all cursor-pointer"
                                title="Set as GOLD (84 OVR)"
                              >
                                🥇 GOLD
                              </button>
                              <button
                                onClick={() => handleSavePlayerRating(p.id, 74)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer"
                                title="Set as SILVER (74 OVR)"
                              >
                                🥈 SILVER
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRatingPlayerId(p.id);
                                  setCurrentEditingRating(p.rating || 80);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-white text-xs font-semibold transition-all ml-1 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setSelectedPreviewPlayer(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/40 text-purple-300 border border-slate-700 transition-all cursor-pointer"
                                title="Preview 3D FUT Card"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">
              No registered players found matching your search.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUCTION COORDINATOR */}
      {activeTab === 'AUCTION' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                  <Gavel className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Live Auction Coordination & Controls</h3>
                  <p className="text-xs text-slate-400">Configure auction rules, base valuations, timer, and launch the podium.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/auction"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Open Podium Stage
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Current Phase</span>
                <h4 className="text-xl font-extrabold text-white">{activePhase}</h4>
                <p className="text-xs text-slate-500">
                  {activePhase === 'LIVE_AUCTION' ? 'Auction is live and open for real-time bids.' : 'Auction is currently paused or in setup.'}
                </p>
                {activePhase !== 'LIVE_AUCTION' && (
                  <button
                    onClick={() => handlePhaseChange('LIVE_AUCTION')}
                    className="mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Activate Live Auction Phase
                  </button>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Available Draft Pool</span>
                <h4 className="text-xl font-extrabold text-purple-300">
                  {players.filter((p) => !p.isSold).length} Players
                </h4>
                <p className="text-xs text-slate-500">
                  {players.filter((p) => p.isSold).length} players successfully sold to franchises.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Total League Purse</span>
                <h4 className="text-xl font-extrabold text-emerald-400">
                  ${(teams.length * 100000).toLocaleString()}
                </h4>
                <p className="text-xs text-slate-500">
                  Across {teams.length} participating franchises.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TOURNAMENT ORGANIZER */}
      {activeTab === 'TOURNAMENT' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Tournament Fixture & League Organizer</h3>
                  <p className="text-xs text-slate-400">Generate round-robin fixtures, configure two-legged matches, and publish standings.</p>
                </div>
              </div>

              <a
                href="/tournament"
                className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-600/30 cursor-pointer"
              >
                <Trophy className="w-4 h-4" /> View Match Center
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h4 className="text-base font-bold text-white">Fixture Configuration & Generation</h4>
              <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={isTwoLegged}
                  onChange={(e) => setIsTwoLegged(e.target.checked)}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                />
                <span>Enable Two-Legged Matches (Home & Away Aggregate Scoring)</span>
              </label>

              <div className="pt-2">
                <button
                  onClick={handleGenerateFixtures}
                  disabled={generatingFixtures}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  {generatingFixtures ? 'Generating League Fixtures...' : 'Arrange & Generate Season Fixtures'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USER APPROVALS (SUPER ADMIN) */}
      {activeTab === 'APPROVALS' && (
        <div className="glass-card p-8 rounded-3xl border border-purple-500/40 space-y-6 neon-glow animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-purple-400" />
                <span>Pending User Registration Approvals</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Authorize Podium Admins, Team Managers, Players, and Spectators.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-900/60 text-purple-300 font-mono">
              {pendingUsers.length} Pending
            </span>
          </div>

          {pendingUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Applicant Name</th>
                    <th className="py-3.5 px-4 font-semibold">Email</th>
                    <th className="py-3.5 px-4 font-semibold">Requested Role</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{u.fullName}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {u.role === 'ADMIN' ? 'Podium Admin' : u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleVerifyUser(u.id, true)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleVerifyUser(u.id, false)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-sm glass-card rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
              <span>All user registrations are verified. No pending approvals.</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SYSTEM STATE & LIFECYCLE NUKE */}
      {activeTab === 'SYSTEM' && (
        <div className="space-y-8 animate-fade-in">
          {/* Phase Control */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Global State Machine Control</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active: {activePhase}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phases.map((p) => {
                const Icon = p.icon;
                const isActive = activePhase === p.key;

                return (
                  <div
                    key={p.key}
                    onClick={() => !isActive && !updating && handlePhaseChange(p.key)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isActive
                        ? 'bg-purple-600/20 border-purple-500/60 neon-glow'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-base">{p.title}</h3>
                        {isActive && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lifecycle Reset (Nuke Protocols) */}
          {user?.role === 'SUPER_ADMIN' && (
            <div className="glass-card p-8 rounded-3xl border border-red-500/30 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-600/20 text-red-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">The "Lifecycle Reset" (Nuke Protocols)</h2>
                  <p className="text-xs text-slate-400">
                    Irreversible protocols to reset tournament data or perform fresh season wipes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">Level 1 Protocol</span>
                  <h3 className="text-base font-bold text-white">Tournament Wipe</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Deletes match fixtures and scores. Reverts to end of auction.
                  </p>
                  <button
                    onClick={() => setNukeModalLevel(1)}
                    className="w-full py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Execute Level 1 Wipe
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <span className="text-xs font-mono font-bold text-orange-400 uppercase">Level 2 Protocol</span>
                  <h3 className="text-base font-bold text-white">Roster Wipe</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Deletes drafted rosters, ledgers, and player photos.
                  </p>
                  <button
                    onClick={() => setNukeModalLevel(2)}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
                  >
                    Execute Level 2 Wipe
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/80 border border-red-500/40 space-y-4">
                  <span className="text-xs font-mono font-bold text-red-400 uppercase">Level 3 Protocol</span>
                  <h3 className="text-base font-bold text-white">Factory Reset</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Wipes all data tables. Retains Super Admin only.
                  </p>
                  <button
                    onClick={() => setNukeModalLevel(3)}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/40 transition-all cursor-pointer"
                  >
                    Execute Factory Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3D FUT Card Preview Modal */}
      {selectedPreviewPlayer && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="glass-card max-w-lg w-full p-8 rounded-3xl border border-purple-500/50 space-y-6 shadow-2xl flex flex-col items-center relative">
            <button
              onClick={() => setSelectedPreviewPlayer(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Live 3D FUT Card Preview
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                {selectedPreviewPlayer.jerseyName || selectedPreviewPlayer.user?.fullName}
              </h3>
            </div>

            <FUTPlayerCard player={selectedPreviewPlayer} size="lg" interactive={true} />

            <div className="w-full flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Assigned Tier:{' '}
                <strong className="text-white">
                  {(selectedPreviewPlayer.rating || 80) >= 88
                    ? 'ACE ($5,000)'
                    : (selectedPreviewPlayer.rating || 80) >= 75
                    ? 'GOLD ($3,000)'
                    : 'SILVER ($1,000)'}
                </strong>
              </span>
              <button
                onClick={() => setSelectedPreviewPlayer(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-Modern Create Franchise Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card max-w-lg w-full p-8 md:p-10 rounded-3xl border border-purple-500/50 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Create Franchise Team</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Register club, purse budget & assign team manager.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-5">
              {/* Team Name */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka Titans"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                />
              </div>

              {/* Code & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Hash className="w-3.5 h-3.5 text-purple-400" />
                    Code (2-4 Chars)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. DTN"
                    value={newTeamCode}
                    onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm font-mono uppercase text-center font-black focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Purse Budget
                  </label>
                  <input
                    type="number"
                    required
                    value={newTeamBudget}
                    onChange={(e) => setNewTeamBudget(Number(e.target.value))}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-emerald-400 text-sm font-mono font-black focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Quick Budget Presets */}
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
                {[100000, 150000, 200000].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setNewTeamBudget(b)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer ${
                      newTeamBudget === b
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ${(b / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>

              {/* Team Color Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  Franchise Color Palette
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { color: '#8b5cf6', label: 'Purple' },
                    { color: '#ef4444', label: 'Crimson' },
                    { color: '#06b6d4', label: 'Cyan' },
                    { color: '#10b981', label: 'Emerald' },
                    { color: '#f59e0b', label: 'Gold' },
                    { color: '#3b82f6', label: 'Blue' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setNewTeamColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        newTeamColor === c.color ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {newTeamColor === c.color && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Team Manager */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                  Assign Team Manager / Owner
                </label>
                <div className="relative">
                  <select
                    required
                    value={newTeamOwnerId}
                    onChange={(e) => setNewTeamOwnerId(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer pr-10 shadow-inner"
                  >
                    <option value="">Select an approved Team Owner</option>
                    {teamOwners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.fullName} ({o.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
                </div>
                {teamOwners.length === 0 && (
                  <span className="text-[11px] text-amber-400 mt-1 block">
                    ⚠️ No users with Team Owner role registered yet. Approve a user first or assign later.
                  </span>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="group relative px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-xl transition-all cursor-pointer overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 shadow-purple-600/40 disabled:opacity-50 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform pointer-events-none" />
                  <span className="relative flex items-center gap-1.5">
                    {creatingTeam ? 'Creating Franchise...' : 'Create Franchise Team'}
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nuke Confirmation Password Modal */}
      {nukeModalLevel && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-red-500/50 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-black text-white">Confirm Level {nukeModalLevel} Reset</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action is <strong className="text-red-400">irreversible</strong>. Enter your Super Admin password to authorize this lifecycle reset.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Super Admin Password</label>
              <input
                type="password"
                placeholder="Enter password..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setNukeModalLevel(null);
                  setAdminPassword('');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteNuke}
                disabled={nuking || !adminPassword}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-xl shadow-red-600/40 disabled:opacity-50 cursor-pointer"
              >
                {nuking ? 'Executing...' : 'Authorize Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
