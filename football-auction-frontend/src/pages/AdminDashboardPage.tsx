import React, { useState, useEffect } from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { useAuth } from '../contexts/AuthContext';
import type { Phase, Player, User } from '../types';
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
  Filter,
  Crown,
  Sparkles,
  Sliders,
  Eye,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { activePhase, refetchState } = useGlobalPhase();
  const { user } = useAuth();
  const [updating, setUpdating] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Players Management State
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(true);
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [selectedPreviewPlayer, setSelectedPreviewPlayer] = useState<Player | null>(null);
  const [editingRatingPlayerId, setEditingRatingPlayerId] = useState<string | null>(null);
  const [currentEditingRating, setCurrentEditingRating] = useState<number>(80);
  const [savingRating, setSavingRating] = useState<boolean>(false);

  // Pending User Approvals State (Super Admin Only)
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Nuke Modal State
  const [nukeModalLevel, setNukeModalLevel] = useState<1 | 2 | 3 | null>(null);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [nuking, setNuking] = useState<boolean>(false);

  // Tournament Fixture Generation
  const [isTwoLegged, setIsTwoLegged] = useState<boolean>(false);
  const [generatingFixtures, setGeneratingFixtures] = useState<boolean>(false);

  const fetchPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const res = await api.get('/players');
      setPlayers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch players:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const fetchPendingUsers = async () => {
    if (user?.role !== 'SUPER_ADMIN') return;
    try {
      setLoadingUsers(true);
      const res = await api.get('/auth/pending-users');
      setPendingUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    if (user?.role === 'SUPER_ADMIN') {
      fetchPendingUsers();
    }
  }, [user]);

  const handleVerifyPlayer = async (playerId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/players/${playerId}/verify`, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Registration parameters unverified' : undefined,
      });
      setMsg(`Player profile ${status.toLowerCase()} successfully`);
      fetchPlayers();
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
      fetchPlayers();
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
      fetchPendingUsers();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'User verification failed');
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

  const handleGenerateFixtures = async () => {
    try {
      setGeneratingFixtures(true);
      setMsg(null);
      await api.post('/tournaments/default/fixtures', {
        seasonId: 'default-season',
        isTwoLegged,
      });
      setMsg(`Tournament fixtures (${isTwoLegged ? 'Two-Legged' : 'Single Match'}) generated successfully!`);
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
      fetchPlayers();
      fetchPendingUsers();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Reset authorization failed');
    } finally {
      setNuking(false);
    }
  };

  const filteredPendingUsers = pendingUsers.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filteredPlayers = players.filter((p) => {
    const name = (p.user?.fullName || p.jerseyName || '').toLowerCase();
    const student = (p.studentId || '').toLowerCase();
    const pos = (p.position || '').toLowerCase();
    const q = playerSearch.toLowerCase();
    return name.includes(q) || student.includes(q) || pos.includes(q);
  });

  const phases: { key: Phase; title: string; desc: string; icon: any }[] = [
    { key: 'SETUP', title: 'Phase 1: Setup', desc: 'Configure season rules, categories, budgets', icon: Settings },
    { key: 'PLAYER_REGISTRATION', title: 'Phase 2: Player Registration', desc: 'Open player submissions and verifications', icon: Activity },
    { key: 'LIVE_AUCTION', title: 'Phase 3: Live Auction', desc: 'Enable live bidding podium and Socket.IO broadcast', icon: Radio },
    { key: 'LIVE_TOURNAMENT', title: 'Phase 4: Live Tournament', desc: 'Enable match scores, fixtures, and statistics', icon: Trophy },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Podium & Super Admin Command Center</h1>
            <p className="text-sm text-slate-400">Player Ratings & Tier Assignment (ACE/GOLD/SILVER), State Machine & Lifecycle</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-purple-900/60 text-purple-300 font-mono border border-purple-500/30">
            Pending User Approvals: {pendingUsers.length}
          </span>
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

      {/* Podium Admin: Player Ratings & Tier Categorization (ACE / GOLD / SILVER) */}
      <div className="glass-card p-8 rounded-3xl border border-purple-500/40 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-purple-400" />
              <span>Player Evaluation & Tier Rating (Podium Admin)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Set player ratings (1-99). The system automatically assigns <strong className="text-cyan-300">ACE (88+)</strong>, <strong className="text-amber-300">GOLD (75-87)</strong>, or <strong className="text-slate-300">SILVER (&lt;75)</strong> with matching 3D holographic card backgrounds!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search registered players..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-purple-900/60 text-purple-300 font-mono">
              {filteredPlayers.length} Players
            </span>
          </div>
        </div>

        {/* Tier Legend Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-cyan-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50" />
              <span className="font-extrabold text-cyan-300">ACE TIER (88 - 99 OVR)</span>
            </div>
            <span className="font-mono text-slate-300 font-bold">$5,000 Base</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
              <span className="font-extrabold text-amber-300">GOLD TIER (75 - 87 OVR)</span>
            </div>
            <span className="font-mono text-slate-300 font-bold">$3,000 Base</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-600/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="font-extrabold text-slate-300">SILVER TIER (&lt; 75 OVR)</span>
            </div>
            <span className="font-mono text-slate-300 font-bold">$1,000 Base</span>
          </div>
        </div>

        {/* Players List with Rating Editors */}
        {loadingPlayers ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading registered players...</div>
        ) : filteredPlayers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Player</th>
                  <th className="py-3.5 px-4 font-semibold">Position</th>
                  <th className="py-3.5 px-4 font-semibold">Current Rating & Tier</th>
                  <th className="py-3.5 px-4 font-semibold">Base Price</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Set Rating (Podium Admin)</th>
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

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-purple-400">
                              {(p.jerseyName || p.user?.fullName || 'P').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="block">{p.jerseyName || p.user?.fullName || 'Player'}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            ID: {p.studentId || 'N/A'} • {p.academicSession || '2023-2024'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
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
                              className="px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-500 text-[10px] font-bold text-white"
                              title="Approve Profile"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyPlayer(p.id, 'REJECTED')}
                              className="px-2 py-0.5 rounded bg-red-600/80 hover:bg-red-500 text-[10px] font-bold text-white"
                              title="Reject Profile"
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
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingRatingPlayerId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preset Buttons */}
                            <button
                              onClick={() => handleSavePlayerRating(p.id, 92)}
                              className="px-2 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-all"
                              title="Set as ACE (92 OVR)"
                            >
                              👑 ACE
                            </button>
                            <button
                              onClick={() => handleSavePlayerRating(p.id, 84)}
                              className="px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition-all"
                              title="Set as GOLD (84 OVR)"
                            >
                              🥇 GOLD
                            </button>
                            <button
                              onClick={() => handleSavePlayerRating(p.id, 74)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold transition-all"
                              title="Set as SILVER (74 OVR)"
                            >
                              🥈 SILVER
                            </button>

                            <button
                              onClick={() => {
                                setEditingRatingPlayerId(p.id);
                                setCurrentEditingRating(p.rating || 80);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-white text-xs font-semibold transition-all ml-1"
                              title="Custom Rating"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => setSelectedPreviewPlayer(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/40 text-purple-300 border border-slate-700 transition-all"
                              title="Preview 3D FUT Card"
                            >
                              <Eye className="w-3.5 h-3.5" />
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

      {/* 3D FUT Card Preview Modal for Podium Admin */}
      {selectedPreviewPlayer && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="glass-card max-w-lg w-full p-8 rounded-3xl border border-purple-500/50 space-y-6 shadow-2xl flex flex-col items-center relative">
            <button
              onClick={() => setSelectedPreviewPlayer(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
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
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Section: Complete User & Role Registration Approvals */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="glass-card p-8 rounded-3xl border border-purple-500/40 space-y-6 neon-glow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-purple-400" />
                <span>Pending User Registration Approvals (Super Admin Only)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Anyone signing up as Podium Admin, Team Manager, Player, or Spectator requires your approval.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-900/60 text-purple-300 font-mono">
              {filteredPendingUsers.length} of {pendingUsers.length} shown
            </span>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="px-2.5 py-1 text-slate-500 flex items-center gap-1 font-semibold">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {['ALL', 'ADMIN', 'TEAM_OWNER', 'PLAYER', 'PUBLIC_GUEST'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    roleFilter === r
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'ADMIN' ? 'Podium Admin' : r === 'TEAM_OWNER' ? 'Team Manager' : r === 'PUBLIC_GUEST' ? 'Spectator' : r}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading pending registrations...</div>
          ) : filteredPendingUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Applicant Name</th>
                    <th className="py-3.5 px-4 font-semibold">Email</th>
                    <th className="py-3.5 px-4 font-semibold">Requested Role</th>
                    <th className="py-3.5 px-4 font-semibold">Registered At</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Super Admin Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPendingUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-purple-400">
                          {u.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{u.fullName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : u.role === 'TEAM_OWNER'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : u.role === 'PLAYER'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                          }`}
                        >
                          {u.role === 'ADMIN' ? 'Podium Admin' : u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleVerifyUser(u.id, true)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleVerifyUser(u.id, false)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs transition-all inline-flex items-center gap-1"
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
              <span>All user registrations are reviewed. No pending approvals matching your filter.</span>
            </div>
          )}
        </div>
      )}

      {/* Global State Machine Switcher */}
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

      {/* Tournament Fixture Generation (Phase 4 Setup) */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <span>Tournament Fixture Generator</span>
        </h2>
        <p className="text-xs text-slate-400">
          Generate round-robin tournament fixtures with single-match or two-legged (Home & Away) aggregated scoring.
        </p>

        <div className="flex flex-wrap items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={isTwoLegged}
              onChange={(e) => setIsTwoLegged(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
            />
            <span>Enable Two-Legged Fixtures (Home & Away Aggregate)</span>
          </label>

          <button
            onClick={handleGenerateFixtures}
            disabled={generatingFixtures}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
          >
            {generatingFixtures ? 'Generating...' : 'Generate Season Fixtures'}
          </button>
        </div>
      </div>

      {/* Super Admin Module 4: Lifecycle Reset (Nuke Protocols) */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="glass-card p-8 rounded-3xl border border-red-500/30 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-600/20 text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">The "Lifecycle Reset" (Nuke Protocols)</h2>
              <p className="text-xs text-slate-400">
                Irreversible protocols to reset database state and wipe Cloudinary assets for next season
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Level 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">Level 1 Protocol</span>
              <h3 className="text-base font-bold text-white">Tournament Wipe</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deletes match fixtures, scores, points tables, and stats. Reverts system to the end of auction (Phase 3).
              </p>
              <button
                onClick={() => setNukeModalLevel(1)}
                className="w-full py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-xs transition-all"
              >
                Execute Level 1 Wipe
              </button>
            </div>

            {/* Level 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <span className="text-xs font-mono font-bold text-orange-400 uppercase">Level 2 Protocol</span>
              <h3 className="text-base font-bold text-white">Roster Wipe</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deletes all players, teams, managers, ledgers, and Cloudinary photos. Retains season rules. Reverts to Phase 1.
              </p>
              <button
                onClick={() => setNukeModalLevel(2)}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all"
              >
                Execute Level 2 Wipe
              </button>
            </div>

            {/* Level 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-red-500/40 space-y-4">
              <span className="text-xs font-mono font-bold text-red-400 uppercase">Level 3 Protocol</span>
              <h3 className="text-base font-bold text-white">Factory Reset</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Wipes all tables and media storage. Retains only Super Admin credentials. Fresh season ready.
              </p>
              <button
                onClick={() => setNukeModalLevel(3)}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/40 transition-all"
              >
                Execute Factory Reset
              </button>
            </div>
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
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteNuke}
                disabled={nuking || !adminPassword}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-xl shadow-red-600/40 disabled:opacity-50"
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
