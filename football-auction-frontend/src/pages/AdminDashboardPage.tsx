import React, { useState, useEffect } from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { useAuth } from '../contexts/AuthContext';
import type { Phase, Player, User } from '../types';
import { api } from '../services/api';
import { Shield, Radio, Activity, Trophy, Settings, CheckCircle2, UserCheck, ShieldAlert, Check, X } from 'lucide-react';

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

  const phases: { key: Phase; title: string; desc: string; icon: any }[] = [
    { key: 'SETUP', title: 'Phase 1: Setup', desc: 'Configure season rules, categories, budgets', icon: Settings },
    { key: 'PLAYER_REGISTRATION', title: 'Phase 2: Player Registration', desc: 'Open player profile submissions and admin verifications', icon: Activity },
    { key: 'LIVE_AUCTION', title: 'Phase 3: Live Auction', desc: 'Enable live bidding stage and Socket.IO broadcast channels', icon: Radio },
    { key: 'LIVE_TOURNAMENT', title: 'Phase 4: Live Tournament', desc: 'Enable match score updates, fixtures, and standings', icon: Trophy },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Admin Command Center</h1>
          <p className="text-sm text-slate-400">Global State Machine controller and franchise management</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-semibold">
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

      {/* Super Admin Section: Pending Admin Registration Approvals */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="glass-card p-8 rounded-3xl border border-purple-500/30 space-y-6 neon-glow">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <span>Pending Admin Account Approvals (Super Admin Only)</span>
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
                    <th className="py-3.5 px-4">Registration Date</th>
                    <th className="py-3.5 px-4 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingAdmins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{adm.fullName}</td>
                      <td className="py-3.5 px-4 text-slate-300">{adm.email}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-purple-400 font-bold">{adm.role}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(adm.createdAt || Date.now()).toLocaleDateString()}
                      </td>
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
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{p.user?.fullName || 'Player'}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-300">{p.position}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{p.category?.name || 'Standard'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        p.registrationStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        p.registrationStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
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
                            Approve Profile
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
    </div>
  );
};
