import React from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { Activity, Radio, Shield, Trophy } from 'lucide-react';

export const PhaseBanner: React.FC = () => {
  const { activePhase } = useGlobalPhase();

  const phaseConfig = {
    SETUP: { label: 'Phase 1: Setup & Configuration', color: 'bg-slate-900/80 text-cyan-300 border-cyan-500/30', icon: Shield },
    PLAYER_REGISTRATION: { label: 'Phase 2: Player Registration Open', color: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30', icon: Activity },
    LIVE_AUCTION: { label: 'Phase 3: LIVE AUCTION IN PROGRESS', color: 'bg-slate-950/80 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10 animate-pulse', icon: Radio },
    LIVE_TOURNAMENT: { label: 'Phase 4: LIVE TOURNAMENT MATCHES', color: 'bg-amber-950/70 text-amber-300 border-amber-500/30', icon: Trophy },
  };

  const config = phaseConfig[activePhase] || phaseConfig.SETUP;
  const Icon = config.icon;

  return (
    <div className={`w-full py-2 px-4 border-b flex items-center justify-center gap-2 text-sm font-semibold tracking-wide ${config.color}`}>
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
    </div>
  );
};
