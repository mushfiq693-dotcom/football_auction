import React, { useState, useEffect } from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { useAuth } from '../contexts/AuthContext';
import type { Phase, Player, User } from '../types';
import { api } from '../services/api';
import {
  Shield,
  Radio,
  Activity,
  Trophy,
  Settings,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
  Check,
  X,
  Trash2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { activePhase, refetchState } = useGlobalPhase();
  const { user } = useAuth();
  const [updating, setUpdating] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Players Management State
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(true);

  // Pending Admin Approvals State (Super Admin Only)
  const [pendingAdmins, setPendingAdmins] = useState<User[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState<boolean>(false);

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

  const fetchPendingAdmins = async () => {
    if (user?.role !== 'SUPER_ADMIN') return;
    try {
      setLoadingAdmins(true);
      const res = await api.get('/auth/pending-admins');
      setPendingAdmins(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pending admins:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    if (user?.role === 'SUPER_ADMIN') {
      fetchPendingAdmins();
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

  const handleVerifyAdmin = async (userId: string, approved: boolean) => {
    try {
      await api.patch(`/auth/verify-admin/${userId}`, { approved });
      setMsg(`Admin account ${approved ? 'approved' : 'rejected'} successfully`);
      fetchPendingAdmins();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Admin verification failed');
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
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Reset authorization failed');
    } finally {
      setNuking(false);
    }
  };

  const phases: { key: Phase; title: string; desc: string; icon: any }[] = [
    { key: 'SETUP', title: 'Phase 1: Setup', desc: 'Configure season rules, categories, budgets', icon: Settings },
    { key: 'PLAYER_REGISTRATION', title: 'Phase 2: Player Registration', desc: 'Open player submissions and verifications', icon: Activity },
    { key: 'LIVE_AUCTION', title: 'Phase 3: Live Auction', desc: 'Enable live bidding podium and Socket.IO broadcast', icon: Radio },
    { key: 'LIVE_TOURNAMENT', title: 'Phase 4: Live Tournament', desc: 'Enable match scores, fixtures, and statistics', icon: Trophy },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Super Admin Command Center</h1>
          <p className="text-sm text-slate-400">Global State Machine controller, fixtures, and lifecycle management</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-semibold">
          {msg}
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

      {/* Super Admin Section: Pending Admin Approvals */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="glass-card p-8 rounded-3xl border border-purple-500/30 space-y-6 neon-glow">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <span>Pending Admin Account Approvals</span>
            </h2>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-900/60 text-purple-300 font-mono">
              {pendingAdmins.length} pending
            </span>
          </div>

          {loadingAdmins ? (
            <div className="py-6 text-center text-slate-400 text-sm">Loading pending admin registrations...</div>
          ) : pendingAdmins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Full Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Requested Role</th>
                    <th className="py-3.5 px-4 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingAdmins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{adm.fullName}</td>
                      <td className="py-3.5 px-4 text-slate-300">{adm.email}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-purple-400 font-bold">{adm.role}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleVerifyAdmin(adm.id, true)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Admin
                        </button>
                        <button
                          onClick={() => handleVerifyAdmin(adm.id, false)}
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
            <div className="py-8 text-center text-slate-500 text-sm">
              No pending Admin registrations requiring Super Admin approval.
            </div>
          )}
        </div>
      )}

      {/* Player Profile Verification Section */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>Player Registration Approvals</span>
          </h2>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
            {players.length} Total
          </span>
        </div>

        {loadingPlayers ? (
          <div className="py-6 text-center text-slate-400 text-sm">Loading players...</div>
        ) : players.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Player Name</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{p.user?.fullName || 'Player'}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{p.studentId || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-300">{p.position}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          p.registrationStatus === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : p.registrationStatus === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {p.registrationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {p.registrationStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleVerifyPlayer(p.id, 'APPROVED')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerifyPlayer(p.id, 'REJECTED')}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-sm">
            No player profiles submitted yet.
          </div>
        )}
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
