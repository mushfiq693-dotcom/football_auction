import React from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { Link } from 'react-router-dom';
import { Zap, Radio, Trophy, Users, Newspaper, Eye, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { activePhase } = useGlobalPhase();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500 selection:text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 px-6 max-w-7xl mx-auto text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-purple-600/20">
          <Zap className="w-4 h-4 text-purple-400" />
          GSTU PREMIER LEAGUE (GPL) • OFFICIAL PLATFORM
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight text-white mb-6">
          GSTU Premier League <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            FUT Arena Live — Cards, Bidding & Fixtures
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-400 mb-10 leading-relaxed font-normal">
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
              className="btn-shine btn-primary-purple px-9 py-4 text-sm md:text-base font-black text-white rounded-2xl flex items-center gap-2.5 hover:-translate-y-0.5 transition-all cursor-pointer group"
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
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Explore Verified Roster</span>
          </Link>
        </div>
      </div>

      {/* Public Spectator Quick-Hub Cards */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link
          to="/auction"
          className="glass-card p-8 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400 mb-6">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-300 transition-colors">
              Live Auction Ledger
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time event streaming ledger showing opening prices, sealed envelopes, and winning bids.
            </p>
          </div>
          <div className="pt-6 flex items-center gap-2 text-xs font-bold text-purple-400">
            <span>Open Public Stage</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/tournament"
          className="glass-card p-8 rounded-3xl border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 flex items-center justify-center text-amber-400 mb-6">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-amber-300 transition-colors">
              Tournament Standings & Stats
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated points table, goal differences, matchday fixtures, and golden boot leaderboards.
            </p>
          </div>
          <div className="pt-6 flex items-center gap-2 text-xs font-bold text-amber-400">
            <span>View Standings & Stats</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/tournament"
          className="glass-card p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 flex items-center justify-center text-emerald-400 mb-6">
              <Newspaper className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-emerald-300 transition-colors">
              News & Press Releases
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Official league announcements, player spotlights, matchday previews, and post-auction coverage.
            </p>
          </div>
          <div className="pt-6 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span>Read League News</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
};
