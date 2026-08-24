import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { FUTPlayerCard } from '../components/FUTPlayerCard';
import type { Team, Player } from '../types';
import {
  Shield,
  Wallet,
  Users,
  Trophy,
  DollarSign,
  TrendingUp,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeamDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTeamData() {
      try {
        setLoading(true);
        // If user is team owner, fetch their team or list of teams
        const res = await api.get('/teams');
        const teamsList: Team[] = res.data.data || [];
        
        // Match user's owned team or pick the first team for demonstration
        const myTeam = teamsList.find((t) => t.owner?.id === user?.id || t.id === user?.teamOwner?.id) || teamsList[0];
        setTeam(myTeam || null);

        if (myTeam) {
          const playersRes = await api.get('/players');
          const allPlayers: Player[] = playersRes.data.data || [];
          const acquired = allPlayers.filter((p) => p.teamId === myTeam.id);
          setPlayers(acquired);
        }
      } catch (err) {
        console.error('Failed to load team dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeamData();
  }, [user]);

  const allocatedBudget = team?.wallet?.allocatedBudget || 100000;
  const currentBalance = team?.wallet?.currentBalance || (allocatedBudget - (team?.wallet?.spentAmount || 0));
  const spentAmount = team?.wallet?.spentAmount || (allocatedBudget - currentBalance);
  const minRosterSize = 11;
  const playersCount = players.length;

  // Mathematical guardrail calculation
  const remainingSlots = Math.max(0, minRosterSize - playersCount);
  const minBasePrice = 1000;
  const maxAllowableBid = Math.max(0, currentBalance - (Math.max(0, remainingSlots - 1) * minBasePrice));

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-10">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 neon-glow">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 flex items-center justify-center shadow-2xl">
            <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center">
              <Shield className="w-10 h-10 text-purple-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-mono">
                {team?.code || 'TM-01'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Franchise Management</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1">
              {team?.name || 'My Franchise Team'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manager: <span className="text-slate-200 font-semibold">{user?.fullName}</span> • Season 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/auction"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            Enter Live Auction Room
          </Link>
        </div>
      </div>

      {/* Financial & Guardrail Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-purple-400" />
            Remaining Purse
          </span>
          <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight pt-2">
            ${currentBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Available to bid on open/blind lots</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Total Spent
          </span>
          <div className="text-3xl font-black text-amber-400 font-mono tracking-tight pt-2">
            ${spentAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Out of ${allocatedBudget.toLocaleString()} allocation</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            Roster Progress
          </span>
          <div className="text-3xl font-black text-white font-mono tracking-tight pt-2">
            {playersCount} / {minRosterSize}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (playersCount / minRosterSize) * 100)}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Max Single Bid Limit
          </span>
          <div className="text-3xl font-black text-purple-300 font-mono tracking-tight pt-2">
            ${maxAllowableBid.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Protected by mathematical budget sentinel</p>
        </div>
      </div>

      {/* Acquired Squad Roster (FUT Cards Grid) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>Acquired Franchise Squad ({players.length} Players)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Players drafted during live auction session. Hover over cards for 3D holographic view.
            </p>
          </div>

          <Link to="/roster" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
            <span>Explore Entire League Roster</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading franchise roster...</div>
        ) : players.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
            {players.map((player) => (
              <FUTPlayerCard
                key={player.id}
                player={player}
                size="md"
                interactive={true}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card py-20 px-6 rounded-3xl border border-slate-800 text-center space-y-4">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <h4 className="text-lg font-bold text-white">No players acquired yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Your roster is currently empty. Participate in the live auction to bid and draft student athletes.
              </p>
            </div>
            <Link
              to="/auction"
              className="inline-block px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
            >
              Go to Live Auction Podium
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
