import React, { useState, useEffect } from 'react';
import type { Player } from '../types';
import { api } from '../services/api';
import { FUTPlayerCard } from '../components/FUTPlayerCard';
import { Users, Search, Filter, Sparkles } from 'lucide-react';

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
    const matchesSearch =
      p.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.jerseyName?.toLowerCase().includes(search.toLowerCase()) ||
      p.position?.toLowerCase().includes(search.toLowerCase()) ||
      p.studentId?.toLowerCase().includes(search.toLowerCase());
    const matchesPos = positionFilter === 'ALL' || p.position === positionFilter;
    return matchesSearch && matchesPos;
  });

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Verified League Draft Roster
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            League Player Roster & <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">FUT Cards</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore university student footballers, positional ratings, categories, and franchise drafts.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 w-56"
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

      {/* Roster Cards 3D Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">Loading verified player cards...</div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {filteredPlayers.map((player) => (
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
          <h4 className="text-lg font-bold text-white">No players found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No registered players match your search keyword or selected position filter.
          </p>
        </div>
      )}
    </div>
  );
};
