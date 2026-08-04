import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import type { AuctionBid, AuctionSession } from '../types';
import confetti from 'canvas-confetti';
import { Clock, User, Zap } from 'lucide-react';
import { api } from '../services/api';

export const LiveAuctionPage: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [activeSession, setActiveSession] = useState<AuctionSession | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [timer, setTimer] = useState<number>(30);
  const [customBid, setCustomBid] = useState<string>('');
  const [bidError, setBidError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Join auction room
    socket.emit('room:join', 'room:auction');

    socket.on('bid:broadcast', (data: { bid: AuctionBid; session: AuctionSession }) => {
      setBids((prev) => [data.bid, ...prev]);
      setActiveSession(data.session);
      setTimer(30); // reset countdown timer on new top bid
    });

    socket.on('auction:state_change', (session: AuctionSession) => {
      setActiveSession(session);
    });

    socket.on('auction:sold', (data: any) => {
      if (data.status === 'SOLD') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    });

    socket.on('bid:error', (err: { message: string }) => {
      setBidError(err.message);
      setTimeout(() => setBidError(null), 4000);
    });

    return () => {
      socket.emit('room:leave', 'room:auction');
      socket.off('bid:broadcast');
      socket.off('auction:state_change');
      socket.off('auction:sold');
      socket.off('bid:error');
    };
  }, [socket]);

  // Countdown timer effect
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handlePlaceBid = async (incrementAmount?: number) => {
    if (!activeSession) return;
    setBidError(null);

    const targetAmount = incrementAmount
      ? activeSession.currentBid + incrementAmount
      : parseFloat(customBid);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setBidError('Invalid bid amount');
      return;
    }

    try {
      await api.post('/auction/bid', {
        auctionSessionId: activeSession.id,
        teamId: user?.teamOwner?.id || user?.id,
        amount: targetAmount,
      });
      setCustomBid('');
    } catch (err: any) {
      setBidError(err.response?.data?.message || 'Bid failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Auction Stage (Left 2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-8 rounded-3xl border border-purple-500/30 neon-glow relative overflow-hidden">
          {/* Header Status Bar */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                LIVE AUCTION STAGE
              </span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className={`font-bold ${timer <= 5 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </div>
          </div>

          {/* Active Player Card Details */}
          {activeSession ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 mb-4 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center">
                    <User className="w-16 h-16 text-purple-300" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white">{activeSession.player.user.fullName}</h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/40 mt-2">
                  {activeSession.player.position}
                </span>
              </div>

              <div className="space-y-6 text-center md:text-left">
                <div>
                  <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Current Top Bid</span>
                  <div className="text-5xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
                    ${activeSession.currentBid.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Base Price</span>
                  <span className="text-sm font-bold text-slate-200">
                    ${activeSession.player.category?.basePrice || 100}
                  </span>
                </div>

                {bidError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
                    ⚠️ {bidError}
                  </div>
                )}

                {/* Bidding Controls */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePlaceBid(50)}
                      className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
                    >
                      +$50
                    </button>
                    <button
                      onClick={() => handlePlaceBid(100)}
                      className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
                    >
                      +$100
                    </button>
                    <button
                      onClick={() => handlePlaceBid(500)}
                      className="py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
                    >
                      +$500
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Custom Bid ($)"
                      value={customBid}
                      onChange={(e) => setCustomBid(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() => handlePlaceBid()}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      Place Bid
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-bounce" />
              <p className="text-lg font-semibold">Waiting for Admin to launch the next auction session...</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Bid Feed (Right 1 col) */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col h-[520px]">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between pb-3 border-b border-slate-800">
          <span>Live Bidding Feed</span>
          <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono">
            {bids.length} bids
          </span>
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {bids.length > 0 ? (
            bids.map((b) => (
              <div key={b.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{b.team?.name || 'Franchise Team'}</div>
                  <div className="text-[10px] text-slate-400">{new Date(b.createdAt).toLocaleTimeString()}</div>
                </div>
                <div className="text-base font-black text-emerald-400 font-mono">
                  ${b.amount.toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              No bids placed yet in this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
