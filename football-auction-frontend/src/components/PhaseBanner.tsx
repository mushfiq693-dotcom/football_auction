import React from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { Activity, Radio, Shield, Trophy } from 'lucide-react';

export const PhaseBanner: React.FC = () => {
  const { activePhase } = useGlobalPhase();

  const phaseConfig = {
    SETUP: {
      label: 'Phase 1: Setup & Configuration Active',
      color: 'bg-slate-950/75 border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      icon: Shield,
    },
    PLAYER_REGISTRATION: {
      label: 'Phase 2: Player Registration & 3D FUT Cards Open',
      color: 'bg-slate-950/75 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      icon: Activity,
    },
    LIVE_AUCTION: {
      label: 'Phase 3: LIVE AUCTION IN PROGRESS — Real-Time Bidding',
      color: 'bg-slate-950/80 border-cyan-400/50 text-cyan-300 shadow-[0_0_25px_rgba(56,189,248,0.3)] animate-pulse',
      icon: Radio,
    },
    LIVE_TOURNAMENT: {
      label: 'Phase 4: LIVE TOURNAMENT MATCHES & LEADERBOARDS',
      color: 'bg-slate-950/75 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      icon: Trophy,
    },
  };

  const config = phaseConfig[activePhase] || phaseConfig.SETUP;
  const Icon = config.icon;

  return (
    <div className={`w-full py-1.5 px-4 border-b backdrop-blur-xl flex items-center justify-center gap-2.5 text-xs font-black tracking-widest uppercase font-mono transition-all z-40 ${config.color}`}>
      <span className="flex h-2 w-2 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
      </span>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </div>
  );
};
