import React, { useState } from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { Phase } from '../types';
import { api } from '../services/api';
import { Shield, Radio, Activity, Trophy, Settings, CheckCircle2 } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { activePhase, refetchState } = useGlobalPhase();
  const [updating, setUpdating] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

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
    </div>
  );
};
