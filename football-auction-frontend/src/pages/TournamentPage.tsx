import React, { useState, useEffect } from 'react';
import type { Match, Standings, TournamentStatistics, NewsArticle } from '../types';
import { api } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import {
  Trophy,
  RefreshCw,
  Calendar,
  Flame,
  Award,
  Shield,
  AlertTriangle,
  Newspaper,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const TournamentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'statistics' | 'news'>('standings');
  const [standings, setStandings] = useState<Standings[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [statistics, setStatistics] = useState<TournamentStatistics | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      setLoading(true);
      const standingsRes = await api.get('/tournaments/default/standings');
      setStandings(standingsRes.data.data || []);
      const matchesRes = await api.get('/tournaments/default/matches');
      setMatches(matchesRes.data.data || []);
      const statsRes = await api.get('/tournaments/default/statistics');
      setStatistics(statsRes.data.data || null);
      const newsRes = await api.get('/news');
      setNews(newsRes.data.data || []);
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

    socket.on('match:score_update', () => {
      fetchData();
    });

    socket.on('statistics:update', (updatedStats: TournamentStatistics) => {
      setStatistics(updatedStats);
    });

    return () => {
      socket.off('standings:update');
      socket.off('match:score_update');
      socket.off('statistics:update');
    };
  }, [socket]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            University Football Tournament Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Spectator portal: Live match scores, automated points table, player stats & news
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-2xl">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'standings'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" /> Points Table
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'matches'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" /> Matches & Scores
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'statistics'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" /> Player Stats
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'news'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4" /> News & Media
        </button>
      </div>

      {/* Tab 1: Standings Table */}
      {activeTab === 'standings' && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6 font-semibold">Pos</th>
                  <th className="py-4 px-6 font-semibold">Franchise Team</th>
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
                      Loading tournament standings...
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
                      <td className="py-4 px-4 text-center font-mono text-emerald-400 font-bold">{s.won}</td>
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
      )}

      {/* Tab 2: Match Fixtures & Live Scores */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-purple-400">{m.roundName || 'Matchday'}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : m.status === 'LIVE'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 text-center md:text-left">
                      <span className="font-bold text-white text-base block">{m.homeTeam?.name || 'Home'}</span>
                      <span className="text-xs text-slate-500 font-mono">{m.homeTeam?.code}</span>
                    </div>

                    <div className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono font-black text-xl text-emerald-400 mx-4">
                      {m.status === 'COMPLETED' || m.status === 'LIVE' ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                    </div>

                    <div className="flex-1 text-center md:text-right">
                      <span className="font-bold text-white text-base block">{m.awayTeam?.name || 'Away'}</span>
                      <span className="text-xs text-slate-500 font-mono">{m.awayTeam?.code}</span>
                    </div>
                  </div>

                  {m.isTwoLegged && (
                    <div className="text-[11px] text-center text-slate-500 font-mono pt-2 border-t border-slate-800">
                      Two-Legged Aggregate: {m.aggregateHomeScore || 0} - {m.aggregateAwayScore || 0}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 glass-card rounded-3xl border border-slate-800">
              No match fixtures generated yet for this season.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Player Statistics Dashboard */}
      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Top Scorers */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Golden Boot (Goals)</span>
            </h3>
            <div className="space-y-3">
              {statistics?.topScorers && statistics.topScorers.length > 0 ? (
                statistics.topScorers.map((s, idx) => (
                  <div key={s.playerId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-500 w-4">{idx + 1}.</span>
                      <div>
                        <span className="font-bold text-white block">{s.fullName}</span>
                        <span className="text-[10px] text-purple-400">{s.teamCode}</span>
                      </div>
                    </div>
                    <span className="font-black text-amber-400 font-mono text-sm">{s.goals} G</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">No goals recorded yet</div>
              )}
            </div>
          </div>

          {/* Top Assists */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Award className="w-5 h-5 text-purple-400" />
              <span>Playmaker (Assists)</span>
            </h3>
            <div className="space-y-3">
              {statistics?.topAssists && statistics.topAssists.length > 0 ? (
                statistics.topAssists.map((s, idx) => (
                  <div key={s.playerId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-500 w-4">{idx + 1}.</span>
                      <div>
                        <span className="font-bold text-white block">{s.fullName}</span>
                        <span className="text-[10px] text-purple-400">{s.teamCode}</span>
                      </div>
                    </div>
                    <span className="font-black text-purple-400 font-mono text-sm">{s.assists} A</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">No assists recorded yet</div>
              )}
            </div>
          </div>

          {/* Clean Sheets */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Golden Glove (Clean Sheets)</span>
            </h3>
            <div className="space-y-3">
              {statistics?.cleanSheets && statistics.cleanSheets.length > 0 ? (
                statistics.cleanSheets.map((s, idx) => (
                  <div key={s.playerId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-500 w-4">{idx + 1}.</span>
                      <div>
                        <span className="font-bold text-white block">{s.fullName}</span>
                        <span className="text-[10px] text-emerald-400">{s.teamCode}</span>
                      </div>
                    </div>
                    <span className="font-black text-emerald-400 font-mono text-sm">{s.cleanSheets} CS</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">No clean sheets yet</div>
              )}
            </div>
          </div>

          {/* Cards & Discipline */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Discipline (Cards)</span>
            </h3>
            <div className="space-y-3">
              {statistics?.cardsLeaderboard && statistics.cardsLeaderboard.length > 0 ? (
                statistics.cardsLeaderboard.map((s, idx) => (
                  <div key={s.playerId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-500 w-4">{idx + 1}.</span>
                      <div>
                        <span className="font-bold text-white block">{s.fullName}</span>
                        <span className="text-[10px] text-slate-400">{s.teamCode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      {s.yellowCards > 0 && <span className="text-amber-400 font-bold">{s.yellowCards} 🟨</span>}
                      {s.redCards > 0 && <span className="text-red-400 font-bold">{s.redCards} 🟥</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">No disciplinary cards recorded</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: News & Media Portal (Spectator Feature) */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-purple-400" />
              <span>Official Tournament News & Press Releases</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">{news.length} articles published</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-3xl border border-slate-800 overflow-hidden hover:border-purple-500/40 transition-all flex flex-col group"
              >
                {item.imageUrl && (
                  <div className="h-48 w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-purple-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{item.content}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-purple-400 font-semibold">
                    <span>Read Full Story</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
