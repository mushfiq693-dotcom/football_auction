import React, { useState, useRef } from 'react';
import type { Player, Position } from '../types';
import { Trophy, Zap, Shield, User as UserIcon, Crown, Sparkles } from 'lucide-react';

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

  // Exact Rating from database or derived from category
  const rawRating = player.rating;
  const tierName = (player.category?.name || '').toLowerCase();
  
  // Categorization based on rating (Rating >= 88: ACE, 75-87: GOLD, <75: SILVER)
  const isAce =
    (rawRating !== undefined && rawRating >= 88) ||
    tierName.includes('ace') ||
    tierName.includes('platinum') ||
    tierName.includes('tier 1') ||
    (player.category?.basePrice || 0) >= 5000;

  const isGold =
    !isAce &&
    ((rawRating !== undefined && rawRating >= 75) ||
      tierName.includes('gold') ||
      tierName.includes('tier 2') ||
      (player.category?.basePrice || 0) >= 3000);

  // Final Overall Rating display (default fallback if not set)
  const overallRating = rawRating !== undefined ? rawRating : isAce ? 92 : isGold ? 84 : 72;

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

  // Position-scaled attributes calculation
  const getStats = () => {
    const scale = overallRating / 80;
    const clamp = (val: number) => Math.min(99, Math.max(40, Math.round(val * scale)));

    switch (player.position) {
      case 'FORWARD':
        return [
          { label: 'PAC', value: clamp(88) },
          { label: 'SHO', value: clamp(90) },
          { label: 'PAS', value: clamp(80) },
          { label: 'DRI', value: clamp(86) },
          { label: 'DEF', value: clamp(45) },
          { label: 'PHY', value: clamp(79) },
        ];
      case 'MIDFIELDER':
        return [
          { label: 'PAC', value: clamp(82) },
          { label: 'SHO', value: clamp(80) },
          { label: 'PAS', value: clamp(89) },
          { label: 'DRI', value: clamp(85) },
          { label: 'DEF', value: clamp(73) },
          { label: 'PHY', value: clamp(81) },
        ];
      case 'DEFENDER':
        return [
          { label: 'PAC', value: clamp(80) },
          { label: 'SHO', value: clamp(56) },
          { label: 'PAS', value: clamp(74) },
          { label: 'DRI', value: clamp(72) },
          { label: 'DEF', value: clamp(90) },
          { label: 'PHY', value: clamp(88) },
        ];
      case 'GOALKEEPER':
        return [
          { label: 'DIV', value: clamp(87) },
          { label: 'HAN', value: clamp(85) },
          { label: 'KIC', value: clamp(78) },
          { label: 'REF', value: clamp(91) },
          { label: 'SPD', value: clamp(54) },
          { label: 'POS', value: clamp(88) },
        ];
      default:
        return [
          { label: 'PAC', value: clamp(84) },
          { label: 'SHO', value: clamp(78) },
          { label: 'PAS', value: clamp(80) },
          { label: 'DRI', value: clamp(82) },
          { label: 'DEF', value: clamp(76) },
          { label: 'PHY', value: clamp(80) },
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

    const rotX = ((y - centerY) / centerY) * -14;
    const rotY = ((x - centerX) / centerX) * 14;

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

  // Dynamic Tier Themes: ACE / GOLD / SILVER
  const cardFoilClass = isAce
    ? 'ace-foil-bg border-purple-400/80 neon-glow-ace ring-1 ring-cyan-400/40'
    : isGold
    ? 'gold-foil-bg border-amber-400/80 neon-glow-gold'
    : 'silver-foil-bg border-slate-300/70 neon-glow-silver';

  const tierBadgeColor = isAce
    ? 'bg-purple-950/90 text-cyan-300 border-cyan-400/60 shadow-lg shadow-purple-500/30'
    : isGold
    ? 'bg-amber-950/90 text-amber-200 border-amber-400/60 shadow-lg shadow-amber-500/30'
    : 'bg-slate-900/90 text-slate-200 border-slate-400/60 shadow-lg shadow-slate-500/20';

  const tierLabel = isAce ? 'ACE' : isGold ? 'GOLD' : 'SILVER';

  const basePrice = isAce ? 5000 : isGold ? 3000 : 1000;

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
          isLivePodium ? 'animated-border-glow ring-4 ring-purple-500/50' : ''
        }`}
      >
        {/* Holographic Dynamic Sheen Layer */}
        <div
          className="absolute inset-0 holographic-sheen pointer-events-none opacity-45 mix-blend-overlay z-20"
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
                isAce ? 'text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]' : isGold ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]' : 'text-slate-200'
              }`}>
                {overallRating}
              </span>
              <span className={`font-black tracking-wider uppercase mt-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} text-white`}>
                {primaryPos}
              </span>
              {secondaryPos && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono mt-0.5 border border-white/10">
                  {secondaryPos}
                </span>
              )}
            </div>

            {/* Tier & Live Badges */}
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-md flex items-center gap-1 ${tierBadgeColor}`}>
                {isAce ? <Crown className="w-3 h-3 text-cyan-300" /> : <Sparkles className="w-3 h-3 text-amber-300" />}
                {tierLabel}
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
            <div className={`absolute inset-0 rounded-full filter blur-xl ${
              isAce ? 'bg-purple-500/30' : isGold ? 'bg-amber-500/30' : 'bg-slate-500/20'
            }`} />
            
            <div className={`relative rounded-2xl overflow-hidden border-2 border-white/20 bg-gradient-to-b from-slate-800/90 to-slate-950 flex items-center justify-center shadow-2xl ${
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
                    st.value >= 88 ? 'text-cyan-300' : st.value >= 75 ? 'text-amber-300' : 'text-slate-200'
                  }`}>
                    {st.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Valuation / Current Bid Banner */}
            <div className="rounded-xl bg-slate-900/90 border border-white/10 px-3 py-1.5 flex items-center justify-between shadow-inner">
              <div className="text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                  {currentBid ? 'Current Bid' : player.isSold ? 'Sold Price' : 'Base Price'}
                </span>
                <span className={`font-black font-mono leading-none ${size === 'sm' ? 'text-xs' : 'text-sm'} text-emerald-400`}>
                  ${(currentBid || player.finalAuctionPrice || player.category?.basePrice || basePrice).toLocaleString()}
                </span>
              </div>

              {player.team ? (
                <div className="text-right flex items-center gap-1 text-amber-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-black uppercase font-mono">{player.team.code}</span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[9px] uppercase font-semibold text-slate-500 block">Tier</span>
                  <span className={`text-[10px] font-black uppercase font-mono ${
                    isAce ? 'text-cyan-300' : isGold ? 'text-amber-300' : 'text-slate-300'
                  }`}>
                    {tierLabel}
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
