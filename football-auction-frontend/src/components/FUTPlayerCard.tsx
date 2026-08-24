import React, { useState, useRef } from 'react';
import type { Player, Position } from '../types';
import { Trophy, Zap, Shield, User as UserIcon } from 'lucide-react';

interface FUTPlayerCardProps {
  player: Partial<Player> & {
    user?: { fullName?: string; email?: string; avatarUrl?: string };
    fullName?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'stage';
  isLivePodium?: boolean;
  currentBid?: number;
  interactive?: boolean;
  className?: string;
}

export const FUTPlayerCard: React.FC<FUTPlayerCardProps> = ({
  player,
  size = 'md',
  isLivePodium = false,
  currentBid,
  interactive = true,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number } | null>(null);

  // Card theme tier
  const tierName = player.category?.name?.toLowerCase() || '';
  const isPlatinum = tierName.includes('platinum') || tierName.includes('tier 1') || (player.category?.basePrice || 0) >= 5000;
  const isGold = !isPlatinum && (tierName.includes('gold') || tierName.includes('tier 2') || (player.category?.basePrice || 0) >= 3000);
  
  // Calculate rating based on tier/base price
  const basePrice = player.category?.basePrice || 1000;
  const overallRating = isPlatinum ? 92 : isGold ? 86 : 79;

  // Short position code
  const getPositionCode = (pos?: Position | string): string => {
    switch (pos) {
      case 'GOALKEEPER': return 'GK';
      case 'DEFENDER': return 'CB';
      case 'MIDFIELDER': return 'CM';
      case 'FORWARD': return 'ST';
      default: return 'PLR';
    }
  };

  const playerName = player.jerseyName || player.user?.fullName || player.fullName || 'PLAYER';
  const primaryPos = getPositionCode(player.position);
  const secondaryPos = player.secondaryPosition ? getPositionCode(player.secondaryPosition) : null;
  const photo = player.photoUrl || player.user?.avatarUrl;

  // Stats calculation based on position
  const getStats = () => {
    switch (player.position) {
      case 'FORWARD':
        return [
          { label: 'PAC', value: 89 },
          { label: 'SHO', value: 91 },
          { label: 'PAS', value: 82 },
          { label: 'DRI', value: 88 },
          { label: 'DEF', value: 45 },
          { label: 'PHY', value: 80 },
        ];
      case 'MIDFIELDER':
        return [
          { label: 'PAC', value: 84 },
          { label: 'SHO', value: 81 },
          { label: 'PAS', value: 90 },
          { label: 'DRI', value: 87 },
          { label: 'DEF', value: 75 },
          { label: 'PHY', value: 83 },
        ];
      case 'DEFENDER':
        return [
          { label: 'PAC', value: 82 },
          { label: 'SHO', value: 58 },
          { label: 'PAS', value: 76 },
          { label: 'DRI', value: 74 },
          { label: 'DEF', value: 91 },
          { label: 'PHY', value: 89 },
        ];
      case 'GOALKEEPER':
        return [
          { label: 'DIV', value: 88 },
          { label: 'HAN', value: 86 },
          { label: 'KIC', value: 80 },
          { label: 'REF', value: 92 },
          { label: 'SPD', value: 55 },
          { label: 'POS', value: 89 },
        ];
      default:
        return [
          { label: 'PAC', value: 85 },
          { label: 'SHO', value: 80 },
          { label: 'PAS', value: 82 },
          { label: 'DRI', value: 84 },
          { label: 'DEF', value: 78 },
          { label: 'PHY', value: 82 },
        ];
    }
  };

  const stats = getStats();

  // Mouse 3D tilt interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition(null);
  };

  // Dimensions based on size prop
  const sizeClasses = {
    sm: 'w-[200px] h-[300px] text-xs',
    md: 'w-[260px] h-[390px] text-sm',
    lg: 'w-[320px] h-[480px] text-base',
    stage: 'w-[340px] md:w-[380px] h-[520px] md:h-[570px] text-base',
  }[size];

  // Foil styling
  const cardFoilClass = isPlatinum
    ? 'platinum-foil-bg border-purple-400/60 neon-glow-platinum'
    : isGold
    ? 'gold-foil-bg border-amber-400/60 neon-glow-gold'
    : 'silver-foil-bg border-slate-300/50';

  const tierBadgeColor = isPlatinum
    ? 'bg-purple-950/80 text-purple-200 border-purple-400/50'
    : isGold
    ? 'bg-amber-950/80 text-amber-200 border-amber-400/50'
    : 'bg-slate-900/80 text-slate-200 border-slate-400/50';

  return (
    <div className={`fut-card-wrapper inline-block ${className}`}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: interactive ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : undefined,
        }}
        className={`fut-card relative rounded-3xl border-2 p-1 overflow-hidden shadow-2xl transition-all duration-200 select-none ${sizeClasses} ${cardFoilClass} ${
          isLivePodium ? 'animated-border-glow ring-4 ring-purple-500/40' : ''
        }`}
      >
        {/* Holographic Dynamic Sheen Layer */}
        <div
          className="absolute inset-0 holographic-sheen pointer-events-none opacity-40 mix-blend-overlay z-20"
          style={
            glarePosition
              ? {
                  backgroundPosition: `${glarePosition.x}% ${glarePosition.y}%`,
                }
              : undefined
          }
        />

        {/* Card Inner Shield Container */}
        <div className="w-full h-full rounded-[22px] bg-slate-950/85 backdrop-blur-md p-4 flex flex-col justify-between relative z-10 border border-white/10">
          
          {/* Top Section: Rating, Position, Tier & Live Status */}
          <div className="flex items-start justify-between">
            {/* OVR + Position Badge */}
            <div className="flex flex-col items-center">
              <span className={`font-black tracking-tighter leading-none ${size === 'sm' ? 'text-3xl' : size === 'stage' ? 'text-5xl' : 'text-4xl'} ${
                isPlatinum ? 'text-purple-300' : isGold ? 'text-amber-300' : 'text-slate-200'
              }`}>
                {overallRating}
              </span>
              <span className={`font-extrabold tracking-wider uppercase mt-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} text-white`}>
                {primaryPos}
              </span>
              {secondaryPos && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-slate-300 font-mono mt-0.5">
                  {secondaryPos}
                </span>
              )}
            </div>

            {/* Tier & Live Badges */}
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-sm ${tierBadgeColor}`}>
                {isPlatinum ? 'PLATINUM' : isGold ? 'GOLD PRO' : 'SILVER'}
              </span>

              {isLivePodium && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600/90 text-white animate-pulse border border-red-400">
                  <Zap className="w-2.5 h-2.5" /> LIVE ON STAGE
                </span>
              )}

              {player.isSold && player.team && (
                <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                  <Trophy className="w-3 h-3 text-emerald-400" /> {player.team.code}
                </span>
              )}
            </div>
          </div>

          {/* Middle Section: Player Photo Avatar */}
          <div className="relative flex-1 flex items-center justify-center my-2">
            <div className="absolute inset-0 bg-radial from-purple-500/20 via-transparent to-transparent rounded-full filter blur-xl" />
            
            <div className={`relative rounded-2xl overflow-hidden border-2 border-white/15 bg-gradient-to-b from-slate-800/80 to-slate-950 flex items-center justify-center shadow-xl ${
              size === 'sm' ? 'w-24 h-24' : size === 'stage' ? 'w-44 h-44' : 'w-32 h-32'
            }`}>
              {photo ? (
                <img
                  src={photo}
                  alt={playerName}
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                  <UserIcon className={`${size === 'sm' ? 'w-10 h-10' : 'w-16 h-16'} text-purple-400/60`} />
                  <span className="text-[10px] uppercase font-mono mt-1 text-slate-400">No Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Player Name & Academic Info */}
          <div className="text-center">
            <h3 className={`font-black uppercase tracking-tight text-white truncate drop-shadow-md ${
              size === 'sm' ? 'text-sm' : size === 'stage' ? 'text-2xl' : 'text-lg'
            }`}>
              {playerName}
            </h3>
            
            <div className="flex items-center justify-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
              {player.studentId && <span>ID: {player.studentId}</span>}
              {player.academicSession && <span>• {player.academicSession}</span>}
            </div>
          </div>

          {/* Bottom Section: Attribute Grid & Price/Bid */}
          <div className="pt-2 border-t border-white/10 mt-2">
            {/* Stats Row */}
            <div className="grid grid-cols-6 gap-1 text-center mb-2">
              {stats.map((st, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {st.label}
                  </span>
                  <span className={`font-mono font-extrabold ${size === 'sm' ? 'text-[11px]' : 'text-xs'} ${
                    st.value >= 90 ? 'text-amber-300' : st.value >= 80 ? 'text-purple-300' : 'text-slate-200'
                  }`}>
                    {st.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Valuation / Current Bid Banner */}
            <div className="rounded-xl bg-slate-900/90 border border-white/10 px-3 py-1.5 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                  {currentBid ? 'Current Bid' : player.isSold ? 'Sold Price' : 'Base Price'}
                </span>
                <span className={`font-black font-mono leading-none ${size === 'sm' ? 'text-xs' : 'text-sm'} text-emerald-400`}>
                  ${(currentBid || player.finalAuctionPrice || basePrice).toLocaleString()}
                </span>
              </div>

              {player.team ? (
                <div className="text-right flex items-center gap-1 text-amber-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-black uppercase font-mono">{player.team.code}</span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[9px] uppercase font-semibold text-slate-500 block">Status</span>
                  <span className="text-[10px] font-bold text-purple-300 uppercase">
                    {player.isSold ? 'SOLD' : 'AVAILABLE'}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
