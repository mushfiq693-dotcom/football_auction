import React from 'react';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { Link } from 'react-router-dom';
import { Shield, Zap, Radio, Trophy, Users } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { activePhase } = useGlobalPhase();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500 selection:text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-24 px-6 max-w-7xl mx-auto text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="w-4 h-4 text-purple-400" />
          University Franchise Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-white mb-6">
          The Ultimate Football <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Auction & Tournament Experience
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
          Real-time live franchise bidding with zero latency, deterministic budget locks, dynamic tournament fixtures, and instant standings updates.
        </p>

        {/* Phase CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {activePhase === 'PLAYER_REGISTRATION' && (
            <Link
              to="/register-player"
              className="px-8 py-4 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Register as Player Now
            </Link>
          )}

          {activePhase === 'LIVE_AUCTION' && (
            <Link
              to="/auction"
              className="px-8 py-4 text-base font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xl shadow-purple-600/40 transition-all flex items-center gap-2 animate-bounce-short"
            >
              <Radio className="w-5 h-5 text-white" />
              Enter Live Auction Stage
            </Link>
          )}

          {activePhase === 'LIVE_TOURNAMENT' && (
            <Link
              to="/tournament"
              className="px-8 py-4 text-base font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xl shadow-amber-400/30 transition-all flex items-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              View Live Matches & Standings
            </Link>
          )}

          <Link
            to="/roster"
            className="px-8 py-4 text-base font-bold text-slate-200 glass-card hover:bg-slate-800 rounded-xl border border-slate-700 transition-all"
          >
            Explore Player Roster
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 mb-6">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Sub-Millisecond Live Bidding</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Realtime Socket.IO broadcasts and pessimistic database locks ensure zero race conditions during intense team bidding wars.
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-400 mb-6">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Atomic Wallet Protection</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Deterministic balance checks prevent budget over-spending and enforce maximum player squad limits per team.
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center text-amber-400 mb-6">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Dynamic Standings Calculator</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Automatic round-robin fixture generator and instant table updates for points, goal differences, and player stats.
          </p>
        </div>
      </div>
    </div>
  );
};
