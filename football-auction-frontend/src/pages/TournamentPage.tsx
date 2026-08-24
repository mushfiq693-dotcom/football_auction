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
  Sparkles,
  Medal,
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
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-cyan-500/20 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2 shadow-lg">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Phase 4: Official Championship Center
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Tournament League &{' '}
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              Matchday Center
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Spectator & Franchise Portal: Real-time scores, automated points table with GD/GF tiebreakers, golden boot stats & press.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn-shine self-start md:self-auto p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md flex items-center gap-2 text-xs font-bold font-mono"
          title="Refresh Live Data"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Live Sync</span>
        </button>
      </div>

      {/* 4 Core Tabs Navigation with Stadium Floodlight Aesthetics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-1.5 rounded-2xl glass-card border border-cyan-500/30 max-w-3xl">
        <button
          onClick={() => setActiveTab('standings')}
          className={`btn-shine py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'standings'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Points Table</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`btn-shine py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'matches'
              ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30 font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Matches</span>
        </button>

        <button
          onClick={() => setActiveTab('statistics')}
          className={`btn-shine py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'statistics'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Flame className="w-4 h-4 text-emerald-400" />
          <span>Player Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`btn-shine py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'news'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Newspaper className="w-4 h-4 text-cyan-400" />
          <span>News & Media</span>
        </button>
      </div>

      {/* Tab 1: Standings Points Table */}
      {activeTab === 'standings' && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 min-w-[700px]">
                <thead className="bg-slate-900/90 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 font-bold">Pos</th>
                    <th className="py-4 px-6 font-bold">Franchise Club</th>
                    <th className="py-4 px-4 font-bold text-center">P</th>
                    <th className="py-4 px-4 font-bold text-center text-emerald-400">W</th>
                    <th className="py-4 px-4 font-bold text-center text-slate-400">D</th>
                    <th className="py-4 px-4 font-bold text-center text-red-400">L</th>
                    <th className="py-4 px-4 font-bold text-center">GF</th>
                    <th className="py-4 px-4 font-bold text-center">GA</th>
                    <th className="py-4 px-4 font-bold text-center text-cyan-300">GD</th>
                    <th className="py-4 px-6 font-black text-amber-400 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400 font-mono animate-pulse">
                        Loading tournament standings...
                      </td>
                    </tr>
                  ) : standings.length > 0 ? (
                    standings.map((s, idx) => (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          idx === 0
                            ? 'bg-amber-950/20'
                            : idx === 1
                            ? 'bg-slate-900/30'
                            : idx === 2
                            ? 'bg-orange-950/15'
                            : ''
                        }`}
                      >
                        <td className="py-4 px-6 font-black font-mono">
                          {idx === 0 ? (
                            <span className="flex items-center gap-1 text-amber-300">
                              <Medal className="w-4 h-4 text-amber-400" /> 1
                            </span>
                          ) : idx === 1 ? (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Medal className="w-4 h-4 text-slate-400" /> 2
                            </span>
                          ) : idx === 2 ? (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Medal className="w-4 h-4 text-amber-600" /> 3
                            </span>
                          ) : (
                            <span className="text-slate-500">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-black text-white flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-600 border border-cyan-500/40 flex items-center justify-center font-mono text-xs font-black text-white shadow-sm flex-shrink-0">
                            {s.team?.code || 'FC'}
                          </div>
                          <div>
                            <span className="block text-sm sm:text-base">{s.team?.name || 'Team'}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">
                              Code: {s.team?.code}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-white">{s.played}</td>
                        <td className="py-4 px-4 text-center font-mono text-emerald-400 font-bold">{s.won}</td>
                        <td className="py-4 px-4 text-center font-mono text-slate-400">{s.drawn}</td>
                        <td className="py-4 px-4 text-center font-mono text-red-400">{s.lost}</td>
                        <td className="py-4 px-4 text-center font-mono">{s.goalsFor}</td>
                        <td className="py-4 px-4 text-center font-mono">{s.goalsAgainst}</td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-cyan-300">
                          {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                        </td>
                        <td className="py-4 px-6 text-center font-black text-amber-400 font-mono text-lg">
                          {s.points}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400 font-mono">
                        No match standings available yet. Super Admin can generate fixtures in Phase 4.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Match Fixtures & Live Scores */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="glass-card p-6 rounded-3xl border border-cyan-500/20 flex flex-col justify-between space-y-4 hover:border-cyan-400/50 transition-all shadow-xl"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-cyan-300 uppercase font-mono tracking-wider">
                      {m.roundName || 'Matchday Fixture'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full font-black text-[10px] uppercase font-mono tracking-wider ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : m.status === 'LIVE'
                          ? 'bg-red-950/90 text-red-300 border border-red-500/50 animate-pulse shadow-lg shadow-red-500/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    {/* Home Team */}
                    <div className="flex-1 text-center md:text-left space-y-0.5">
                      <span className="font-black text-white text-base md:text-lg block">
                        {m.homeTeam?.name || 'Home Team'}
                      </span>
                      <span className="text-xs text-cyan-400 font-mono font-bold">[{m.homeTeam?.code}]</span>
                    </div>

                    {/* Score Center Box */}
                    <div className="px-6 py-3 rounded-2xl bg-slate-950 border border-cyan-500/40 font-mono font-black text-2xl text-cyan-300 mx-4 shadow-xl">
                      {m.status === 'COMPLETED' || m.status === 'LIVE' ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center md:text-right space-y-0.5">
                      <span className="font-black text-white text-base md:text-lg block">
                        {m.awayTeam?.name || 'Away Team'}
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">[{m.awayTeam?.code}]</span>
                    </div>
                  </div>

                  {/* Two-Legged Aggregate Note */}
                  {m.isTwoLegged && (
                    <div className="text-xs text-center text-slate-300 font-mono pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Two-Legged Aggregate: {m.aggregateHomeScore || 0} - {m.aggregateAwayScore || 0}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 glass-card rounded-3xl border border-cyan-500/20 font-mono">
              No match fixtures generated yet for this season.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Player Statistics Dashboard (Golden Boot, Playmaker, Clean Sheets, Cards) */}
      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Top Scorers / Golden Boot */}
          <div className="glass-card p-6 rounded-3xl border border-amber-500/30 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Golden Boot (Goals)</span>
            </h3>
            <div className="space-y-3">
              {statistics?.topScorers && statistics.topScorers.length > 0 ? (
                statistics.topScorers.map((s, idx) => (
                  <div key={s.playerId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-slate-500 w-4 font-mono">{idx + 1}.</span>
                      <div>
                        <span className="font-bold text-white block">{s.fullName}</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">[{s.teamCode}]</span>
                      </div>
                    </div>
                    <span className="font-black text-amber-400 font-mono text-sm bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/40">
                      {s.goals} G
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-8 text-center font-mono">No goals recorded yet</div>
              )}
            </div>
          </div>

          {/* 2. Top Assists / Playmaker */}
          <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Award className="w-5 h-5 text-cyan-400" />
              <span>Playmaker (Assists)</span>
            </h3>
            <div className="space-y-3">
              {statistics?.topAssists && statistics.topAssists.length > 0 ? (
                statistics.topAssists.map((s, idx) => (
                  <div key={s.playerId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-slate-500 w-4 font-mono">{idx + 1}.</span>
                      <div>
                        <span className="font-bold text-white block">{s.fullName}</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">[{s.teamCode}]</span>
                      </div>
                    </div>
                    <span className="font-black text-cyan-300 font-mono text-sm bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/40">
                      {s.assists} A
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-8 text-center font-mono">No assists recorded yet</div>
              )}
            </div>
          </div>

          {/* 3. Golden Glove / Clean Sheets */}
          <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Golden Glove (Clean Sheets)</span>
            </h3>
            <div className="space-y-3">
              {statistics?.cleanSheets && statistics.cleanSheets.length > 0 ? (
                statistics.cleanSheets.map((s, idx) => (
                  <div key={s.playerId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-slate-500 w-4 font-mono">{idx + 1}.</span>
                      <div>
                        <span className="font-bold text-white block">{s.fullName}</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">[{s.teamCode}]</span>
                      </div>
                    </div>
                    <span className="font-black text-emerald-400 font-mono text-sm bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                      {s.cleanSheets} CS
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-8 text-center font-mono">No clean sheets yet</div>
              )}
            </div>
          </div>

          {/* 4. Discipline / Cards Leaderboard */}
          <div className="glass-card p-6 rounded-3xl border border-red-500/30 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Discipline (Cards)</span>
            </h3>
            <div className="space-y-3">
              {statistics?.cardsLeaderboard && statistics.cardsLeaderboard.length > 0 ? (
                statistics.cardsLeaderboard.map((s, idx) => (
                  <div key={s.playerId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-slate-500 w-4 font-mono">{idx + 1}.</span>
                      <div>
                        <span className="font-bold text-white block">{s.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">[{s.teamCode}]</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      {s.yellowCards > 0 && <span className="text-amber-400 font-bold">{s.yellowCards} 🟨</span>}
                      {s.redCards > 0 && <span className="text-red-400 font-bold">{s.redCards} 🟥</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-8 text-center font-mono">No disciplinary cards recorded</div>
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
              <Newspaper className="w-5 h-5 text-cyan-400" />
              <span>Official Tournament News & Match Reports</span>
            </h2>
            <span className="text-xs font-mono text-cyan-400">{news.length} articles published</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-3xl border border-cyan-500/20 overflow-hidden hover:border-cyan-400/50 transition-all flex flex-col group shadow-xl"
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
                    <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 font-normal">{item.content}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-cyan-400 font-bold uppercase tracking-wider">
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
