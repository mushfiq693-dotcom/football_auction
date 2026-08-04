import React, { useState, useEffect } from 'react';
import type { Match, Standings } from '../types';
import { api } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { Trophy, RefreshCw, Calendar } from 'lucide-react';

export const TournamentPage: React.FC = () => {
  const [standings, setStandings] = useState<Standings[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      setLoading(true);
      const standingsRes = await api.get('/tournaments/default/standings');
      setStandings(standingsRes.data.data || []);
      const matchesRes = await api.get('/tournaments/default/matches');
      setMatches(matchesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load tournament data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!socket) return;
    socket.on('standings:update', (updatedStandings: Standings[]) => {
      setStandings(updatedStandings);
    });

    return () => {
      socket.off('standings:update');
    };
  }, [socket]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            University League & Tournament
          </h1>
          <p className="text-sm text-slate-400 mt-1">Live points table, goal differences, and match fixtures</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Standings Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>League Table</span>
        </h2>
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6 font-semibold">Pos</th>
                <th className="py-4 px-6 font-semibold">Team</th>
                <th className="py-4 px-4 font-semibold text-center">P</th>
                <th className="py-4 px-4 font-semibold text-center">W</th>
                <th className="py-4 px-4 font-semibold text-center">D</th>
                <th className="py-4 px-4 font-semibold text-center">L</th>
                <th className="py-4 px-4 font-semibold text-center">GF</th>
                <th className="py-4 px-4 font-semibold text-center">GA</th>
                <th className="py-4 px-4 font-semibold text-center">GD</th>
                <th className="py-4 px-6 font-bold text-emerald-400 text-center">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Loading standings...
                  </td>
                </tr>
              ) : standings.length > 0 ? (
                standings.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-black text-purple-400">
                        {s.team?.code || 'FC'}
                      </div>
                      <span>{s.team?.name || 'Team'}</span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono">{s.played}</td>
                    <td className="py-4 px-4 text-center font-mono text-emerald-400">{s.won}</td>
                    <td className="py-4 px-4 text-center font-mono text-slate-400">{s.drawn}</td>
                    <td className="py-4 px-4 text-center font-mono text-red-400">{s.lost}</td>
                    <td className="py-4 px-4 text-center font-mono">{s.goalsFor}</td>
                    <td className="py-4 px-4 text-center font-mono">{s.goalsAgainst}</td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-indigo-400">
                      {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                    </td>
                    <td className="py-4 px-6 text-center font-black text-emerald-400 font-mono text-base">
                      {s.points}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No match standings available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Fixtures */}
      {matches.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span>Match Fixtures</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m) => (
              <div key={m.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{m.homeTeam?.name || 'Home Team'}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-purple-400">
                  {m.status === 'COMPLETED' ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{m.awayTeam?.name || 'Away Team'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
