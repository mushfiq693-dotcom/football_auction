import React from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { Activity, Radio, Shield, Trophy } from 'lucide-react';

export const PhaseBanner: React.FC = () => {
  const { activePhase } = useGlobalPhase();

  const phaseConfig = {
    SETUP: { label: 'Phase 1: Setup & Configuration', color: 'bg-blue-600/20 text-blue-400 border-blue-500/30', icon: Shield },
    PLAYER_REGISTRATION: { label: 'Phase 2: Player Registration Open', color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30', icon: Activity },
    LIVE_AUCTION: { label: 'Phase 3: LIVE AUCTION IN PROGRESS', color: 'bg-purple-600/20 text-purple-400 border-purple-500/30 animate-pulse-slow', icon: Radio },
    LIVE_TOURNAMENT: { label: 'Phase 4: LIVE TOURNAMENT MATCHES', color: 'bg-amber-600/20 text-amber-400 border-amber-500/30', icon: Trophy },
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
