import React, { useState, useEffect } from 'react';
import type { Player } from '../types';
import { api } from '../services/api';
import { Users, Search, Filter, UserCheck, Tag, Shield } from 'lucide-react';

export const PlayerRosterPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true);
        const response = await api.get('/players');
        setPlayers(response.data.data || []);
      } catch (err) {
        console.error('Failed to load player roster:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch = p.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                          p.position?.toLowerCase().includes(search.toLowerCase());
    const matchesPos = positionFilter === 'ALL' || p.position === positionFilter;
    return matchesSearch && matchesPos;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            Registered Player Roster
          </h1>
          <p className="text-sm text-slate-400 mt-1">Explore all university players, positions, and auction status</p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search player name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 appearance-none"
            >
              <option value="ALL">All Positions</option>
              <option value="FORWARD">FORWARD</option>
              <option value="MIDFIELDER">MIDFIELDER</option>
              <option value="DEFENDER">DEFENDER</option>
              <option value="GOALKEEPER">GOALKEEPER</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading roster...</div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <div key={player.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-purple-500/50 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {player.position}
                </span>
                {player.isSold ? (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    SOLD
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    AVAILABLE
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center text-center py-2">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 mb-3 shadow-lg group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                    <UserCheck className="w-10 h-10 text-purple-300" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-base">{player.user?.fullName || 'Player'}</h3>
                {player.jerseyNumber && (
                  <span className="text-xs font-mono text-purple-400 font-semibold mt-0.5">#{player.jerseyNumber}</span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>{player.category?.name || 'Uncategorized'}</span>
                </div>
                {player.team ? (
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{player.team.code}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">${player.category?.basePrice || 100}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500">
          No players match your search criteria.
        </div>
      )}
    </div>
  );
};
