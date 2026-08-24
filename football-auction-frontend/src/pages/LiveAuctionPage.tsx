import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import type { AuctionBid, AuctionSession, Player } from '../types';
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
  Layers,
  Award,
  Sparkles,
  User as UserIcon,
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
  const [unsoldPool, setUnsoldPool] = useState<Player[]>([]);
  const [showPoolModal, setShowPoolModal] = useState<boolean>(false);
  const [revealedWinner, setRevealedWinner] = useState<any | null>(null);

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

  useEffect(() => {
    fetchActiveSession();
    if (isAuctioneer) {
      fetchUnsoldPool();
    }

    if (!socket) return;

    socket.emit('room:join', 'room:auction');

    socket.on('bid:broadcast', (data: { bid: AuctionBid; session: AuctionSession }) => {
      setBids((prev) => [data.bid, ...prev]);
      setActiveSession(data.session);
      setTimer(30);
      setRevealedWinner(null);
    });

    socket.on('auction:state_change', (session: AuctionSession) => {
      setActiveSession(session);
      setTimer(session.timerSeconds || 30);
      setRevealedWinner(null);
    });

    socket.on('auction:sold', (data: any) => {
      if (data.status === 'SOLD') {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        setRevealedWinner(data);
      }
      fetchActiveSession();
      if (isAuctioneer) fetchUnsoldPool();
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
  }, [socket, isAuctioneer]);

  // Countdown timer effect
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

    const targetAmount = exactAmount !== undefined ? exactAmount : parseFloat(customBid);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setBidError('Invalid bid amount');
      return;
    }

    try {
      await api.post('/auction/bid', {
        auctionSessionId: activeSession.id,
        teamId: user?.teamOwner?.id || user?.id,
        amount: targetAmount,
        isBlindBid: activeSession.auctionType === 'BLIND',
      });
      setCustomBid('');
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Bid failed');
    }
  };

  // Auctioneer Controls
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

  const handleLaunchPlayerSession = async (playerId: string, auctionType: 'NORMAL' | 'BLIND') => {
    try {
      await api.post('/auction/session', {
        seasonId: activeSession?.seasonId || 'default-season',
        playerId,
        auctionType,
        timerSeconds: 30,
      });
      setShowPoolModal(false);
      fetchActiveSession();
      fetchUnsoldPool();
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Failed to launch player session');
    }
  };

  const dynamicIncrements = activeSession?.dynamicIncrements?.suggestedIncrements || [100, 250, 500];
  const nextMinBid = activeSession?.dynamicIncrements?.nextMinimumBid || (activeSession?.currentBid ? activeSession.currentBid + 100 : 1000);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
      {/* Podium Auctioneer Control Bar (Admins Only) */}
      {isAuctioneer && (
        <div className="glass-card p-5 rounded-3xl border border-purple-500/40 neon-glow flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/30 text-purple-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400 block">
                Podium Auctioneer Overrides
              </span>
              <span className="text-sm font-bold text-white">
                Live Stage Controller (Phase 3)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                fetchUnsoldPool();
                setShowPoolModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Pull Unsold Player ({unsoldPool.length})
            </button>

            {activeSession && (
              <>
                <button
                  onClick={handleTogglePause}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    activeSession.status === 'ACTIVE'
                      ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {activeSession.status === 'ACTIVE' ? <><Pause className="w-4 h-4" /> Pause Timer</> : <><Play className="w-4 h-4" /> Resume Timer</>}
                </button>

                <button
                  onClick={handleRollback}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" /> Rollback Bid
                </button>

                <button
                  onClick={handleFinalize}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Finalize / Knock Down
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Podium Stage with 3D FUT Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-purple-500/30 neon-glow relative overflow-hidden">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                  {activeSession?.auctionType === 'BLIND' ? '🔒 BLIND SEALED AUCTION' : '⚡ LIVE OPEN BIDDING PODIUM'}
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-sm shadow-inner">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className={`font-bold ${timer <= 5 ? 'text-red-400 animate-pulse text-base' : 'text-amber-400'}`}>
                  00:{timer < 10 ? `0${timer}` : timer}
                </span>
              </div>
            </div>

            {revealedWinner && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-purple-600/30 border border-emerald-500/50 text-white flex items-center gap-3 animate-pulse">
                <Award className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black">🎉 PLAYER SOLD / KNOCKED DOWN!</h4>
                  <p className="text-xs text-slate-300">
                    Sold to winning franchise for ${revealedWinner.winningAmount?.toLocaleString() || revealedWinner.session?.currentBid?.toLocaleString()}!
                  </p>
                </div>
              </div>
            )}

            {/* Active Player 3D FUT Card Broadcast */}
            {activeSession ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* 3D FUT Card Broadcast Display */}
                <div className="md:col-span-6 flex flex-col items-center justify-center">
                  <FUTPlayerCard
                    player={activeSession.player}
                    size="stage"
                    isLivePodium={true}
                    currentBid={activeSession.currentBid}
                    interactive={true}
                  />
                </div>

                {/* Live Bidding Ticker & Controls */}
                <div className="md:col-span-6 space-y-6 text-center md:text-left">
                  {activeSession.auctionType === 'BLIND' ? (
                    <div className="p-6 rounded-2xl bg-purple-950/40 border border-purple-500/40">
                      <EyeOff className="w-8 h-8 text-purple-400 mb-2" />
                      <h4 className="text-lg font-bold text-white">Sealed Envelope Mode</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Bids are strictly hidden from other managers. Submit your sealed envelope. Highest bidder wins at T=0!
                      </p>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5 justify-center md:justify-start">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Current Highest Bid
                      </span>
                      <div className="text-5xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
                        ${activeSession.currentBid.toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">Base Price</span>
                      <span className="text-sm font-bold text-slate-200">
                        ${activeSession.player.category?.basePrice || 1000}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">Next Minimum Bid</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        ${nextMinBid.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {bidError && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{bidError}</span>
                    </div>
                  )}

                  {/* Bidding Controls for Franchise Owners & Admins */}
                  {user && (user.role === 'TEAM_OWNER' || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') ? (
                    <div className="space-y-3 pt-2">
                      {activeSession.auctionType !== 'BLIND' && (
                        <div className="grid grid-cols-3 gap-2">
                          {dynamicIncrements.map((inc, i) => (
                            <button
                              key={i}
                              onClick={() => handlePlaceBid(activeSession.currentBid + inc)}
                              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all font-mono"
                            >
                              +${inc.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={activeSession.auctionType === 'BLIND' ? 'Sealed Bid Amount ($)' : `Min $${nextMinBid}`}
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                        />
                        <button
                          onClick={() => handlePlaceBid()}
                          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                        >
                          {activeSession.auctionType === 'BLIND' ? 'Seal Envelope' : 'Place Bid'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-center space-y-2">
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span>Public Spectator Broadcast</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Watching real-time live auction stream with holographic card broadcasting.
                      </p>
                      {!user && (
                        <a
                          href="/login"
                          className="inline-block px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
                        >
                          Sign in as Franchise Owner to Bid
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-4">
                <Zap className="w-16 h-16 text-slate-600 mx-auto animate-bounce" />
                <p className="text-xl font-bold text-slate-300">
                  Waiting for Podium Auctioneer to pull next player to live stage...
                </p>
                {isAuctioneer && (
                  <button
                    onClick={() => {
                      fetchUnsoldPool();
                      setShowPoolModal(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Select Player from Pool
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Live Ledger Feed */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl border border-slate-800 flex flex-col h-[640px]">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Live Auction Ledger
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-mono">
              {bids.length} bids
            </span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {bids.length > 0 ? (
              bids.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:border-purple-500/40 transition-colors"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{b.team?.name || 'Franchise Team'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(b.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-base font-black text-emerald-400 font-mono">
                    {b.isBlindBid ? '🔒 SEALED' : `$${b.amount.toLocaleString()}`}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center text-xs text-slate-500">
                No bids recorded yet in this session ledger.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unsold Pool Selection Modal for Podium Admin */}
      {showPoolModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="glass-card max-w-2xl w-full p-8 rounded-3xl border border-purple-500/40 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>Select Player for Live Podium</span>
              </h3>
              <button
                onClick={() => setShowPoolModal(false)}
                className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-xl bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {unsoldPool.length > 0 ? (
                unsoldPool.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{p.jerseyName || p.user?.fullName}</h4>
                        <span className="text-[10px] font-mono text-purple-400">{p.position}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLaunchPlayerSession(p.id, 'NORMAL')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
                      >
                        Open Bid
                      </button>
                      <button
                        onClick={() => handleLaunchPlayerSession(p.id, 'BLIND')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
                      >
                        Blind Bid
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No unsold or verified players available in the pool.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
