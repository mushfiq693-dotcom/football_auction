import React, { useState, useEffect } from 'react';
import type { Player } from '../types';
import { api } from '../services/api';
import { FUTPlayerCard } from '../components/FUTPlayerCard';
import {
  Users,
  Search,
  Filter,
  Sparkles,
  Star,
  X,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PlayerRosterPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('auction_watchlist') || '[]');
    } catch {
      return [];
    }
  });

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

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPlayer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleWatchlist = (playerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchlist((prev) => {
      const next = prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId];
      localStorage.setItem('auction_watchlist', JSON.stringify(next));
      return next;
    });
  };

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.jerseyName?.toLowerCase().includes(search.toLowerCase()) ||
      p.position?.toLowerCase().includes(search.toLowerCase()) ||
      p.studentId?.toLowerCase().includes(search.toLowerCase());
    const matchesPos = positionFilter === 'ALL' || p.position === positionFilter;
    return matchesSearch && matchesPos;
  });

  // Calculate dynamic stat attributes based on overall rating and position
  const getPlayerStats = (player: Player) => {
    const ovr = player.rating || 75;
    const pos = player.position;

    if (pos === 'FORWARD') {
      return [
        { label: 'PAC', full: 'Pace', val: Math.min(99, Math.round(ovr * 0.98)) },
        { label: 'SHO', full: 'Shooting', val: Math.min(99, Math.round(ovr * 0.99)) },
        { label: 'PAS', full: 'Passing', val: Math.min(99, Math.round(ovr * 0.85)) },
        { label: 'DRI', full: 'Dribbling', val: Math.min(99, Math.round(ovr * 0.95)) },
        { label: 'DEF', full: 'Defending', val: Math.min(99, Math.round(ovr * 0.52)) },
        { label: 'PHY', full: 'Physicality', val: Math.min(99, Math.round(ovr * 0.82)) },
      ];
    } else if (pos === 'MIDFIELDER') {
      return [
        { label: 'PAC', full: 'Pace', val: Math.min(99, Math.round(ovr * 0.88)) },
        { label: 'SHO', full: 'Shooting', val: Math.min(99, Math.round(ovr * 0.84)) },
        { label: 'PAS', full: 'Passing', val: Math.min(99, Math.round(ovr * 0.98)) },
        { label: 'DRI', full: 'Dribbling', val: Math.min(99, Math.round(ovr * 0.94)) },
        { label: 'DEF', full: 'Defending', val: Math.min(99, Math.round(ovr * 0.74)) },
        { label: 'PHY', full: 'Physicality', val: Math.min(99, Math.round(ovr * 0.85)) },
      ];
    } else if (pos === 'DEFENDER') {
      return [
        { label: 'PAC', full: 'Pace', val: Math.min(99, Math.round(ovr * 0.82)) },
        { label: 'SHO', full: 'Shooting', val: Math.min(99, Math.round(ovr * 0.55)) },
        { label: 'PAS', full: 'Passing', val: Math.min(99, Math.round(ovr * 0.76)) },
        { label: 'DRI', full: 'Dribbling', val: Math.min(99, Math.round(ovr * 0.72)) },
        { label: 'DEF', full: 'Defending', val: Math.min(99, Math.round(ovr * 0.99)) },
        { label: 'PHY', full: 'Physicality', val: Math.min(99, Math.round(ovr * 0.96)) },
      ];
    } else {
      // GOALKEEPER
      return [
        { label: 'DIV', full: 'Diving', val: Math.min(99, Math.round(ovr * 0.96)) },
        { label: 'HAN', full: 'Handling', val: Math.min(99, Math.round(ovr * 0.94)) },
        { label: 'KIC', full: 'Kicking', val: Math.min(99, Math.round(ovr * 0.86)) },
        { label: 'REF', full: 'Reflexes', val: Math.min(99, Math.round(ovr * 0.98)) },
        { label: 'SPE', full: 'Speed', val: Math.min(99, Math.round(ovr * 0.65)) },
        { label: 'POS', full: 'Positioning', val: Math.min(99, Math.round(ovr * 0.92)) },
      ];
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-cyan-500/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Verified League Draft Roster
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            League Player Roster &{' '}
            <span className="bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
              3D FUT Cards
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Explore university football athletes, positional ratings, tiers, and click any card to inspect full holographic dossier.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 text-white text-sm focus:outline-none focus:border-cyan-400 w-56 shadow-inner"
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="pl-10 pr-6 py-2.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 text-white text-sm focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer shadow-inner"
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

      {/* Watchlist Counter Banner */}
      {watchlist.length > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-cyan-300 font-bold">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>
              You have {watchlist.length} football athlete{watchlist.length > 1 ? 's' : ''} saved in your Auction Watchlist!
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Click card to open full inspect dossier</span>
        </div>
      )}

      {/* Roster Cards 3D Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-300 font-mono animate-pulse">
          Loading verified player cards...
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {filteredPlayers.map((player) => {
            const isStarred = watchlist.includes(player.id);
            return (
              <motion.div
                key={player.id}
                whileHover={{ scale: 1.03, y: -6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlayer(player)}
                className="relative group/card flex flex-col items-center cursor-pointer"
              >
                {/* Watchlist Star Button Overlay */}
                <button
                  onClick={(e) => toggleWatchlist(player.id, e)}
                  className={`absolute top-2 right-2 z-20 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-lg ${
                    isStarred
                      ? 'bg-amber-500/90 text-slate-950 scale-110 shadow-amber-500/40'
                      : 'bg-slate-900/80 hover:bg-cyan-600/80 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                  title={isStarred ? 'Remove from Watchlist' : 'Add to Auction Watchlist'}
                >
                  <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
                </button>

                {/* Inspect Overlay Badge on Hover */}
                <div className="absolute bottom-3 inset-x-3 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-400/50 text-cyan-300 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> Click to Inspect
                  </span>
                </div>

                <FUTPlayerCard player={player} size="md" interactive={true} />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card py-20 px-6 rounded-3xl border border-cyan-500/20 text-center space-y-4">
          <Users className="w-12 h-12 text-slate-500 mx-auto" />
          <h4 className="text-lg font-bold text-white">No players found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No registered players match your search keyword or selected position filter.
          </p>
        </div>
      )}

      {/* Large Player Card Inspection Modal with Framer Motion Animation */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPlayer(null)}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 35 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl glass-card rounded-3xl border border-cyan-500/40 p-6 sm:p-8 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] my-auto max-h-[92vh] flex flex-col"
            >
              {/* Background Floodlight Beam Ray inside modal */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-b from-cyan-400/20 via-emerald-400/10 to-transparent blur-[90px] pointer-events-none" />

              {/* Top Modal Header / Actions */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-black uppercase font-mono tracking-widest text-cyan-300">
                    Official Player Dossier & 3D Hologram
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWatchlist(selectedPlayer.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      watchlist.includes(selectedPlayer.id)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${watchlist.includes(selectedPlayer.id) ? 'fill-amber-400 text-amber-400' : ''}`}
                    />
                    <span>
                      {watchlist.includes(selectedPlayer.id) ? 'In Watchlist' : 'Add to Watchlist'}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="p-2 rounded-xl bg-slate-900/90 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-all cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Left 3D Large Card, Right Attributes & Profile */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6 overflow-y-auto pr-1 relative z-10">
                {/* Left: Large 3D FUT Card */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="scale-105 sm:scale-110 transform-gpu">
                    <FUTPlayerCard player={selectedPlayer} size="lg" interactive={true} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-4 text-center block">
                    Move mouse/finger over card for 3D Holographic Glare
                  </span>
                </div>

                {/* Right: Detailed Dossier & Stat Breakdown */}
                <div className="md:col-span-7 space-y-5">
                  {/* Player Basic Info */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase font-mono">
                        {selectedPlayer.position}
                      </span>
                      {selectedPlayer.studentId && (
                        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono">
                          ID: {selectedPlayer.studentId}
                        </span>
                      )}
                      {selectedPlayer.isSold ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          SOLD TO {selectedPlayer.team?.name || 'FRANCHISE'} (৳{(selectedPlayer.finalAuctionPrice || 0).toLocaleString()})
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          AVAILABLE IN AUCTION DRAFT
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {selectedPlayer.user?.fullName}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Jersey: <span className="text-white font-bold">{selectedPlayer.jerseyName || 'PLAYER'}</span>
                      {selectedPlayer.academicSession && ` • Session: ${selectedPlayer.academicSession}`}
                    </p>
                  </div>

                  {/* Rating & Base Price Pill */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono font-black text-lg">
                        {selectedPlayer.rating || 75}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Overall Rating
                        </div>
                        <div className="text-xs font-black text-cyan-300">
                          {selectedPlayer.rating && selectedPlayer.rating >= 88
                            ? 'ACE TIER (TIER 1)'
                            : selectedPlayer.rating && selectedPlayer.rating >= 75
                            ? 'GOLD TIER (TIER 2)'
                            : 'SILVER TIER'}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-black text-lg">
                        ৳
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Base Opening Price
                        </div>
                        <div className="text-xs font-black text-emerald-300 font-mono">
                          ৳{(selectedPlayer.category?.basePrice || 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attribute Radar Breakdown Bars */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>Positional Skill Attributes</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-normal">MAX 99</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {getPlayerStats(selectedPlayer).map((stat) => (
                        <div key={stat.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono font-bold">
                            <span className="text-slate-300">{stat.label} • {stat.full}</span>
                            <span className="text-cyan-300">{stat.val}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${stat.val}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className={`h-full rounded-full ${
                                stat.val >= 85
                                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                                  : stat.val >= 75
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : 'bg-gradient-to-r from-slate-500 to-slate-400'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
