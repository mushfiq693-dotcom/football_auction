import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import type { AuctionBid, AuctionSession, Player, Team } from '../types';
import { FUTPlayerCard } from '../components/FUTPlayerCard';
import confetti from 'canvas-confetti';
import {
  Clock,
  Zap,
  Play,
  Pause,
  RotateCcw,
  EyeOff,
  CheckCircle,
  UserPlus,
  AlertCircle,
  Shield,
  Award,
  Sparkles,
  Search,
  DollarSign,
  Crown,
  Lock,
  Sliders,
  Users,
  X,
} from 'lucide-react';
import { api } from '../services/api';

export const LiveAuctionPage: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [activeSession, setActiveSession] = useState<AuctionSession | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [timer, setTimer] = useState<number>(30);
  const [customBid, setCustomBid] = useState<string>('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [unsoldPool, setUnsoldPool] = useState<Player[]>([]);
  const [showPoolModal, setShowPoolModal] = useState<boolean>(false);
  const [poolSearch, setPoolSearch] = useState<string>('');
  const [revealedWinner, setRevealedWinner] = useState<any | null>(null);
  const [launchingLot, setLaunchingLot] = useState<boolean>(false);
  const [placingBid, setPlacingBid] = useState<boolean>(false);

  // Competitor Rosters & Budgets Overlay
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [showTeamsOverlay, setShowTeamsOverlay] = useState<boolean>(false);

  // Dynamic Overrides State
  const [overrideTimerInput, setOverrideTimerInput] = useState<string>('');
  const [overridePriceInput, setOverridePriceInput] = useState<string>('');
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);

  const isAuctioneer = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const fetchActiveSession = async () => {
    try {
      const res = await api.get('/auction/active');
      if (res.data.data) {
        setActiveSession(res.data.data);
        setBids(res.data.data.bids || []);
        setTimer(res.data.data.timerSeconds || 30);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Failed to fetch active auction session:', err);
    }
  };

  const fetchUnsoldPool = async () => {
    try {
      const res = await api.get('/auction/unsold-pool');
      setUnsoldPool(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch unsold pool:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setAllTeams(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  useEffect(() => {
    fetchActiveSession();
    fetchUnsoldPool();
    fetchTeams();

    if (!socket) return;

    socket.emit('room:join', 'room:auction');

    socket.on('bid:broadcast', (data: { bid: AuctionBid; session: AuctionSession }) => {
      setBids((prev) => [data.bid, ...prev]);
      setActiveSession(data.session);
      setTimer(30);
      setRevealedWinner(null);
      setBidSuccess(`🎉 New top bid: $${data.bid.amount.toLocaleString()} by ${data.bid.team?.name || 'Franchise'}`);
      setTimeout(() => setBidSuccess(null), 3000);
      fetchTeams();
    });

    socket.on('auction:state_change', (session: AuctionSession) => {
      setActiveSession(session);
      setTimer(session.timerSeconds || 30);
      setRevealedWinner(null);
      setBids(session.bids || []);
      fetchTeams();
    });

    socket.on('auction:sold', (data: any) => {
      if (data.status === 'SOLD') {
        confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });
        setRevealedWinner(data);
      }
      fetchActiveSession();
      fetchUnsoldPool();
      fetchTeams();
    });

    socket.on('auction:rollback', (session: AuctionSession) => {
      setActiveSession(session);
      setBids((prev) => prev.slice(1));
    });

    socket.on('bid:error', (err: { message: string }) => {
      setBidError(err.message);
      setTimeout(() => setBidError(null), 5000);
    });

    return () => {
      socket.emit('room:leave', 'room:auction');
      socket.off('bid:broadcast');
      socket.off('auction:state_change');
      socket.off('auction:sold');
      socket.off('auction:rollback');
      socket.off('bid:error');
    };
  }, [socket]);

  // Real-time Countdown Timer effect
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (isAuctioneer && activeSession.status === 'ACTIVE') {
            api.post(`/auction/session/${activeSession.id}/finalize`).catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, isAuctioneer]);

  const handlePlaceBid = async (exactAmount?: number) => {
    if (!activeSession) return;
    setBidError(null);
    setBidSuccess(null);

    const targetAmount = exactAmount !== undefined ? exactAmount : parseFloat(customBid);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setBidError('Please enter a valid positive bid amount');
      return;
    }

    try {
      setPlacingBid(true);
      const res = await api.post('/auction/bid', {
        auctionSessionId: activeSession.id,
        amount: targetAmount,
        isBlindBid: activeSession.auctionType === 'BLIND',
      });
      if (res.data.data?.isBlindBid) {
        setBidSuccess('🔒 Sealed envelope bid placed successfully!');
        setTimeout(() => setBidSuccess(null), 4000);
      }
      setCustomBid('');
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Bid submission failed');
      setTimeout(() => setBidError(null), 5000);
    } finally {
      setPlacingBid(false);
    }
  };

  // Auctioneer Stage Controls
  const handleTogglePause = async () => {
    if (!activeSession) return;
    const nextStatus = activeSession.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/auction/session/${activeSession.id}/status`, { status: nextStatus });
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRollback = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/auction/session/${activeSession.id}/rollback`);
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to rollback bid');
    }
  };

  const handleFinalize = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/auction/session/${activeSession.id}/finalize`);
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to finalize auction');
    }
  };

  const handleQuickAddTimer = async (secondsToAdd: number) => {
    if (!activeSession) return;
    try {
      await api.patch(`/auction/session/${activeSession.id}/override`, {
        timerSeconds: timer + secondsToAdd,
      });
      setTimer((prev) => prev + secondsToAdd);
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to adjust timer');
    }
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    try {
      const payload: any = {};
      if (overrideTimerInput) payload.timerSeconds = parseInt(overrideTimerInput, 10);
      if (overridePriceInput) payload.currentBid = parseFloat(overridePriceInput);

      await api.patch(`/auction/session/${activeSession.id}/override`, payload);
      setShowOverrideModal(false);
      setOverrideTimerInput('');
      setOverridePriceInput('');
      fetchActiveSession();
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to apply dispute override');
    }
  };

  const handleLaunchPlayerSession = async (playerId: string, auctionType: 'NORMAL' | 'BLIND') => {
    try {
      setLaunchingLot(true);
      setBidError(null);
      const res = await api.post('/auction/session', {
        playerId,
        auctionType,
        timerSeconds: 30,
      });
      setActiveSession(res.data.data);
      setBids([]);
      setTimer(30);
      setRevealedWinner(null);
      setShowPoolModal(false);
      fetchActiveSession();
      fetchUnsoldPool();
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to launch auction session');
    } finally {
      setLaunchingLot(false);
    }
  };

  const dynamicIncrements = activeSession?.dynamicIncrements?.suggestedIncrements || [100, 250, 500];
  const nextMinBid =
    activeSession?.dynamicIncrements?.nextMinimumBid ||
    (activeSession?.currentBid ? activeSession.currentBid + 100 : activeSession?.player?.category?.basePrice || 1000);

  const filteredUnsold = unsoldPool.filter((p) => {
    const name = (p.user?.fullName || p.jerseyName || '').toLowerCase();
    const pos = (p.position || '').toLowerCase();
    const q = poolSearch.toLowerCase();
    return name.includes(q) || pos.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
      {/* Podium Auctioneer Control Banner (Admins & Super Admins) */}
      {isAuctioneer && (
        <div className="glass-card p-5 rounded-3xl border border-purple-500/40 neon-glow flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 block">
                Podium Stage Control (Phase 3)
              </span>
              <span className="text-sm font-black text-white">
                Live Lot Orchestrator & Dispute Authority
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                fetchUnsoldPool();
                setShowPoolModal(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Select Player Lot ({unsoldPool.length})
            </button>

            {activeSession && (
              <>
                <button
                  onClick={() => setShowOverrideModal(true)}
                  className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Dynamic Floor Overrides"
                >
                  <Sliders className="w-4 h-4" /> Overrides
                </button>

                <button
                  onClick={() => handleQuickAddTimer(15)}
                  className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  title="Add +15s to Clock"
                >
                  +15s
                </button>

                <button
                  onClick={handleTogglePause}
                  className={`px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSession.status === 'ACTIVE'
                      ? 'bg-amber-600/80 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  {activeSession.status === 'ACTIVE' ? <><Pause className="w-4 h-4" /> Pause Clock</> : <><Play className="w-4 h-4" /> Resume Clock</>}
                </button>

                <button
                  onClick={handleRollback}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" /> Rollback
                </button>

                <button
                  onClick={handleFinalize}
                  className="px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Finalize / Knock Down
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Live Stage Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Podium Stage with 3D FUT Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-purple-500/40 shadow-2xl relative overflow-hidden">
            {/* Header Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-500"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-purple-300">
                  {activeSession?.auctionType === 'BLIND'
                    ? '🔒 BLIND SEALED ENVELOPE AUCTION'
                    : '⚡ LIVE OPEN BIDDING PODIUM STAGE'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Competitor Rosters Drawer Toggle */}
                <button
                  onClick={() => setShowTeamsOverlay((prev) => !prev)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Franchise Rosters ({allTeams.length})</span>
                </button>

                {/* 30-Second Countdown Clock */}
                <div className="flex items-center gap-2.5 px-5 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 font-mono shadow-inner">
                  <Clock className={`w-5 h-5 ${timer <= 5 ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
                  <span className={`font-black ${timer <= 5 ? 'text-red-400 animate-pulse text-lg' : 'text-amber-400 text-base'}`}>
                    00:{timer < 10 ? `0${timer}` : timer}
                  </span>
                </div>
              </div>
            </div>

            {/* Sold Confetti Banner */}
            {revealedWinner && (
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-purple-600/30 border border-emerald-500/50 text-white flex items-center gap-4 animate-fade-in shadow-xl">
                <Award className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-black">🎉 PLAYER SOLD / KNOCKED DOWN!</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Acquired by winning franchise for ${revealedWinner.winningAmount?.toLocaleString() || revealedWinner.session?.currentBid?.toLocaleString()}!
                  </p>
                </div>
              </div>
            )}

            {/* Error & Success Messages */}
            {bidError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{bidError}</span>
              </div>
            )}

            {bidSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{bidSuccess}</span>
              </div>
            )}

            {/* Stage Center Card Display */}
            {activeSession && activeSession.player ? (
              <div className="flex flex-col items-center justify-center space-y-6 py-2">
                <FUTPlayerCard
                  player={activeSession.player}
                  size="stage"
                  isLivePodium={true}
                  currentBid={activeSession.currentBid}
                  interactive={true}
                />

                {/* Current Leading Bid Display */}
                <div className="w-full max-w-md p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-center space-y-2 shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    {activeSession.auctionType === 'BLIND' ? 'Blind Auction Status' : 'Current Highest Bid'}
                  </span>
                  <div className="text-3xl md:text-4xl font-black font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                    {activeSession.auctionType === 'BLIND'
                      ? `${bids.length} Sealed Envelopes Submitted`
                      : `$${(activeSession.currentBid || activeSession.player.category?.basePrice || 1000).toLocaleString()}`}
                  </div>
                  {activeSession.bids && activeSession.bids[0]?.team && activeSession.auctionType !== 'BLIND' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 text-purple-300 text-xs font-mono font-bold border border-purple-500/40">
                      <span>Leading Franchise:</span>
                      <strong className="text-white">{activeSession.bids[0].team.name} ({activeSession.bids[0].team.code})</strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Idle State */
              <div className="py-24 text-center space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-xl shadow-purple-600/10">
                  <Zap className="w-10 h-10 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Podium Stage is Idle</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Waiting for the Podium Stage Manager to pull the next football athlete from the draft pool.
                  </p>
                </div>

                {isAuctioneer && (
                  <button
                    onClick={() => {
                      fetchUnsoldPool();
                      setShowPoolModal(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-purple-600/40 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Open Draft Pool Selector
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Live Bidding Actions & Real-Time Ledger Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Real-time Bid Placement Card */}
          {activeSession && activeSession.status === 'ACTIVE' && (
            <div className="glass-card p-6 rounded-3xl border border-purple-500/40 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Place Your Bid</span>
                </h3>
                <span className="text-[10px] font-mono text-purple-400 font-bold">
                  Next Min: ${nextMinBid.toLocaleString()}
                </span>
              </div>

              {activeSession.auctionType === 'BLIND' ? (
                /* Blind Bidding Input */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" /> Sealed Envelope Rule
                    </span>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Enter your confidential bid. Amounts remain hidden until the clock expires!
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      placeholder={`Enter blind bid (min $${nextMinBid})...`}
                      value={customBid}
                      onChange={(e) => setCustomBid(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={() => handlePlaceBid()}
                    disabled={placingBid || !customBid}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {placingBid ? 'Submitting Sealed Envelope...' : 'Submit Sealed Blind Bid'}
                  </button>
                </div>
              ) : (
                /* Open Dynamic Increments Bidding */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {dynamicIncrements.map((inc, i) => {
                      const amount = (activeSession.currentBid || activeSession.player?.category?.basePrice || 1000) + inc;
                      return (
                        <button
                          key={i}
                          onClick={() => handlePlaceBid(amount)}
                          disabled={placingBid}
                          className="py-3 px-2 rounded-2xl bg-slate-900/90 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-400 text-center transition-all cursor-pointer group"
                        >
                          <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-purple-300 block">
                            +${inc}
                          </span>
                          <span className="text-xs font-black font-mono text-emerald-400 block mt-0.5">
                            ${amount.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Or Custom Exact Bid:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={`e.g. ${nextMinBid}`}
                        value={customBid}
                        onChange={(e) => setCustomBid(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handlePlaceBid()}
                        disabled={placingBid || !customBid}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
                      >
                        {placingBid ? '...' : 'Bid'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time Bid Stream Ledger */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 max-h-[500px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Live Session Ledger</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                {bids.length} Bids
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
              {bids.length > 0 ? (
                bids.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between hover:border-purple-500/40 transition-colors shadow-sm"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Crown className="w-3 h-3 text-purple-400" />
                        <span>{b.team?.name || 'Franchise Team'}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        {new Date(b.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      {b.isBlindBid ? '🔒 SEALED' : `$${b.amount.toLocaleString()}`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-xs text-slate-500">
                  No bids recorded in this lot session yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Competitor Rosters & Budgets Modal/Drawer */}
      {showTeamsOverlay && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card max-w-3xl w-full p-8 rounded-3xl border border-purple-500/50 shadow-2xl max-h-[85vh] flex flex-col relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>Competitor Franchise Rosters & Wallets</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live budget balances and acquired squad progress across all teams.
                </p>
              </div>
              <button
                onClick={() => setShowTeamsOverlay(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {allTeams.length > 0 ? (
                allTeams.map((t) => {
                  const budget = t.wallet?.currentBalance ?? (100000 - (t.wallet?.spentAmount || 0));
                  const spent = t.wallet?.spentAmount ?? 0;
                  const bought = t.wallet?.playersBoughtCount ?? (t.players?.length || 0);

                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center font-mono font-black text-purple-300 text-sm">
                          {t.code}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{t.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">
                            Manager: {t.owner?.fullName || 'Assigned Owner'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Purse Left</span>
                          <span className="text-sm font-black text-emerald-400">${budget.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Spent</span>
                          <span className="text-sm font-black text-amber-400">${spent.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Squad</span>
                          <span className="text-sm font-black text-white">{bought} / 11</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">No franchise teams registered yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Podium Admin Dynamic Overrides Modal */}
      {showOverrideModal && activeSession && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-purple-500/50 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>On-the-Fly Floor Overrides</span>
              </h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Adjust Countdown Timer (Seconds)
                </label>
                <input
                  type="number"
                  placeholder={`Current: ${timer}s`}
                  value={overrideTimerInput}
                  onChange={(e) => setOverrideTimerInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Modify Base Valuation / Opening Price ($)
                </label>
                <input
                  type="number"
                  placeholder={`Current: $${activeSession.currentBid || activeSession.player?.category?.basePrice || 1000}`}
                  value={overridePriceInput}
                  onChange={(e) => setOverridePriceInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Apply Overrides
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Select Player for Live Podium Modal */}
      {showPoolModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-card max-w-2xl w-full p-8 rounded-3xl border border-purple-500/50 shadow-2xl max-h-[85vh] flex flex-col relative">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 mb-4 gap-3">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  <span>Select Player for Live Podium</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick a player and select Open Bid or Blind Bid to launch immediately to stage.
                </p>
              </div>

              <button
                onClick={() => setShowPoolModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Search Filter in Pool */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search player in draft pool..."
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 shadow-inner"
              />
            </div>

            {/* Unsold Pool List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredUnsold.length > 0 ? (
                filteredUnsold.map((p) => {
                  const rating = p.rating !== undefined ? p.rating : 80;
                  const isAce = rating >= 88;
                  const isGold = rating >= 75 && rating < 88;
                  const tierName = isAce ? 'ACE' : isGold ? 'GOLD' : 'SILVER';
                  const baseVal = isAce ? 5000 : isGold ? 3000 : 1000;
                  const photo = p.photoUrl || p.user?.avatarUrl;

                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/50 transition-all shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                          {photo ? (
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="font-bold text-sm text-purple-400">
                              {(p.jerseyName || p.user?.fullName || 'P').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-white">{p.jerseyName || p.user?.fullName}</h4>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                isAce
                                  ? 'bg-purple-950 text-cyan-300 border-cyan-400/50'
                                  : isGold
                                  ? 'bg-amber-950 text-amber-300 border-amber-400/50'
                                  : 'bg-slate-800 text-slate-300 border-slate-600'
                              }`}
                            >
                              {rating} OVR • {tierName}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            {p.position} • Base: ${baseVal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Launch Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLaunchPlayerSession(p.id, 'NORMAL')}
                          disabled={launchingLot}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Open Bid</span>
                        </button>
                        <button
                          onClick={() => handleLaunchPlayerSession(p.id, 'BLIND')}
                          disabled={launchingLot}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Blind Bid</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-slate-500 text-sm">
                  No unsold players found in the draft pool matching your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
