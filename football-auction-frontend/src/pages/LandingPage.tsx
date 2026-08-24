import React from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { Link } from 'react-router-dom';
import { Zap, Radio, Trophy, Users, Eye, ArrowRight, Sparkles } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { activePhase } = useGlobalPhase();

  return (
    <div className="min-h-screen text-white relative">
      {/* Stadium Overhead Floodlight Beam Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-cyan-400/20 via-emerald-400/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        {/* Subtle Pitch Light Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-cyan-300 text-xs font-black uppercase tracking-wider mb-6 shadow-xl border border-cyan-500/30">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>GSTU PREMIER LEAGUE (GPL) • OFFICIAL LEAGUE PLATFORM</span>
        </div>

        {/* Hero Headline with Floodlight Glow */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight text-white mb-6 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
          GSTU Premier League <br />
          <span className="bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            FUT Arena Live — Cards, Bidding & Fixtures
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-300 mb-10 leading-relaxed font-medium drop-shadow-md">
          {activePhase === 'SETUP' &&
            'Season pre-configuration in progress. Franchise owners, purse budgets, and rules setup.'}
          {activePhase === 'PLAYER_REGISTRATION' &&
            'Player registration portal is now OPEN! Submit your profile, positions, and generate your 3D FUT Card.'}
          {activePhase === 'LIVE_AUCTION' &&
            '🔴 LIVE AUCTION IN PROGRESS! Watch the real-time franchise bidding war and live ledger.'}
          {activePhase === 'LIVE_TOURNAMENT' &&
            '🏆 TOURNAMENT LIVE! Track live match scores, dynamic points table, and golden boot stats.'}
        </p>

        {/* Phase-Dynamic Public Hero CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-5">
          {activePhase === 'PLAYER_REGISTRATION' && (
            <Link
              to="/register-player"
              className="btn-shine px-9 py-4 text-sm md:text-base font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl shadow-xl shadow-emerald-600/30 border border-emerald-400/40 flex items-center gap-2.5 hover:-translate-y-0.5 transition-all"
            >
              <Users className="w-5 h-5" />
              <span>Register as Player Now</span>
            </Link>
          )}

          {activePhase === 'LIVE_AUCTION' && (
            <Link
              to="/auction"
              className="btn-shine btn-primary-purple px-9 py-4 text-sm md:text-base font-black text-white rounded-2xl flex items-center gap-2.5 hover:-translate-y-0.5 transition-all cursor-pointer group shadow-2xl"
            >
              <Radio className="w-5 h-5 text-white animate-pulse" />
              <span>Watch Live Auction Ledger (Spectator)</span>
            </Link>
          )}

          {activePhase === 'LIVE_TOURNAMENT' && (
            <Link
              to="/tournament"
              className="btn-shine px-9 py-4 text-sm md:text-base font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-2xl shadow-xl shadow-amber-400/30 border border-amber-300/50 flex items-center gap-2.5 hover:-translate-y-0.5 transition-all"
            >
              <Trophy className="w-5 h-5 text-slate-950" />
              <span>View Live Matches & Standings</span>
            </Link>
          )}

          <Link
            to="/roster"
            className="btn-shine btn-secondary-glass px-9 py-4 text-sm md:text-base font-bold text-slate-200 hover:text-white rounded-2xl flex items-center gap-2.5 hover:-translate-y-0.5 transition-all"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Explore Verified Roster</span>
          </Link>
        </div>
      </div>

      {/* Public Spectator Quick-Hub Cards */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link
          to="/auction"
          className="glass-card p-8 rounded-3xl border border-cyan-500/20 hover:border-cyan-400/60 transition-all flex flex-col justify-between group shadow-xl hover:-translate-y-1"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-black mb-2 text-white group-hover:text-cyan-300 transition-colors">
              Live Auction Ledger
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Real-time event streaming ledger showing opening prices, sealed envelopes, and winning bids.
            </p>
          </div>
          <div className="pt-6 flex items-center gap-2 text-xs font-black text-cyan-400 uppercase tracking-wider">
            <span>Open Public Stage</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/tournament"
          className="glass-card p-8 rounded-3xl border border-amber-500/20 hover:border-amber-400/60 transition-all flex flex-col justify-between group shadow-xl hover:-translate-y-1"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2 text-white group-hover:text-amber-300 transition-colors">
              Tournament Standings & Stats
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Automated points table, goal differences, matchday fixtures, and golden boot leaderboards.
            </p>
          </div>
          <div className="pt-6 flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
            <span>View Standings & Stats</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/roster"
          className="glass-card p-8 rounded-3xl border border-emerald-500/20 hover:border-emerald-400/60 transition-all flex flex-col justify-between group shadow-xl hover:-translate-y-1"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2 text-white group-hover:text-emerald-300 transition-colors">
              Verified Player Directory
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Explore university athlete profiles, positional ratings, tier cards, and player attributes.
            </p>
          </div>
          <div className="pt-6 flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
            <span>Explore All Cards</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Atmospheric Floodlight Match Features Strip */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="glass-card p-8 rounded-3xl border border-cyan-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="font-mono text-3xl font-black text-cyan-300">100%</div>
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Real-Time Sync</div>
          </div>
          <div className="space-y-1">
            <div className="font-mono text-3xl font-black text-emerald-400">3D FUT</div>
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Holographic Cards</div>
          </div>
          <div className="space-y-1">
            <div className="font-mono text-3xl font-black text-amber-400">2-Legged</div>
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tournament Fixtures</div>
          </div>
          <div className="space-y-1">
            <div className="font-mono text-3xl font-black text-purple-300">Anti-Chaos</div>
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Budget Sentinels</div>
          </div>
        </div>
      </div>
    </div>
  );
};
