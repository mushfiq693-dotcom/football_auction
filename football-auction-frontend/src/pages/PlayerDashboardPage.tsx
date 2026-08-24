import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { FUTPlayerCard } from '../components/FUTPlayerCard';
import type { Player, Position } from '../types';
import {
  User,
  Shield,
  Trophy,
  Save,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  Radio,
} from 'lucide-react';

export const PlayerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Player Form State
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [studentId, setStudentId] = useState<string>('');
  const [academicSession, setAcademicSession] = useState<string>('2023-2024');
  const [jerseyName, setJerseyName] = useState<string>('');
  const [jerseyNumber, setJerseyNumber] = useState<string>('10');
  const [position, setPosition] = useState<Position>('FORWARD');
  const [secondaryPosition, setSecondaryPosition] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [existingPlayer, setExistingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    async function loadPlayerData() {
      try {
        setLoading(true);
        const res = await api.get('/players/me');
        if (res.data.data) {
          const p = res.data.data;
          setExistingPlayer(p);
          setFullName(p.user?.fullName || user?.fullName || '');
          setStudentId(p.studentId || '');
          setAcademicSession(p.academicSession || '2023-2024');
          setJerseyName(p.jerseyName || '');
          setJerseyNumber(p.jerseyNumber ? String(p.jerseyNumber) : '10');
          setPosition(p.position || 'FORWARD');
          setSecondaryPosition(p.secondaryPosition || '');
          setPhotoUrl(p.photoUrl || '');
        }
      } catch (err: any) {
        // If not found yet, initialize with defaults
        if (user) {
          setFullName(user.fullName || '');
        }
      } finally {
        setLoading(false);
      }
    }
    loadPlayerData();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        fullName,
        studentId,
        academicSession,
        jerseyName: jerseyName.toUpperCase() || fullName.toUpperCase(),
        jerseyNumber: parseInt(jerseyNumber, 10) || 10,
        position,
        secondaryPosition: secondaryPosition || undefined,
        photoUrl: photoUrl || undefined,
      };

      const res = await api.post('/players/register', payload);
      setExistingPlayer(res.data.data);
      setSuccessMessage('🎉 Player profile & FUT Card updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save player profile.');
    } finally {
      setSaving(false);
    }
  };

  // Preview object for live FUT card rendering
  const livePlayerPreview: Partial<Player> = {
    ...existingPlayer,
    jerseyName: jerseyName.toUpperCase() || fullName.toUpperCase() || 'PLAYER',
    studentId: studentId || 'STU-2026',
    academicSession: academicSession || '2023-2024',
    position: position,
    secondaryPosition: (secondaryPosition as Position) || undefined,
    photoUrl: photoUrl || existingPlayer?.photoUrl,
    user: {
      id: user?.id || 'preview',
      email: user?.email || '',
      fullName: fullName || 'Your Name',
      role: 'PLAYER',
      avatarUrl: photoUrl,
    },
    category: existingPlayer?.category || {
      id: 'tier1',
      name: 'Platinum Elite',
      basePrice: 5000,
      minBidIncrement: 500,
      maxPlayersPerTeam: 15,
    },
    isSold: existingPlayer?.isSold || false,
    finalAuctionPrice: existingPlayer?.finalAuctionPrice,
    team: existingPlayer?.team,
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Official Player Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Player Dashboard & <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">FUT Card Creator</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build your holographic player card, customize your position, and track live auction status.
          </p>
        </div>

        {existingPlayer?.isSold && existingPlayer?.team && (
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40">
            <Trophy className="w-8 h-8 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                DRAFTED TO FRANCHISE
              </span>
              <span className="text-base font-black text-white">
                {existingPlayer.team.name} ({existingPlayer.team.code})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Form Left, 3D FUT Card Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Profile Creator Form (7 cols) */}
        <div className="lg:col-span-7 glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Player Details & Media</h3>
                <p className="text-xs text-slate-400">Card details update live on the right as you type.</p>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-3 animate-fade-in">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Mushfiqur Rahman"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Jersey Name (Card Title)
                </label>
                <input
                  type="text"
                  value={jerseyName}
                  onChange={(e) => setJerseyName(e.target.value)}
                  placeholder="e.g. MUSHFIQ"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm uppercase focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 2020331001"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Academic Session
                </label>
                <select
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="2021-2022">2021-2022</option>
                  <option value="2022-2023">2022-2023</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Primary Position (Required)
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as Position)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-bold"
                >
                  <option value="FORWARD">FORWARD (ST / CF / RW / LW)</option>
                  <option value="MIDFIELDER">MIDFIELDER (CAM / CM / CDM)</option>
                  <option value="DEFENDER">DEFENDER (CB / LB / RB)</option>
                  <option value="GOALKEEPER">GOALKEEPER (GK)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Secondary Position (Optional)
                </label>
                <select
                  value={secondaryPosition}
                  onChange={(e) => setSecondaryPosition(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">None</option>
                  <option value="FORWARD">FORWARD</option>
                  <option value="MIDFIELDER">MIDFIELDER</option>
                  <option value="DEFENDER">DEFENDER</option>
                  <option value="GOALKEEPER">GOALKEEPER</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Photo URL / Cloudinary Image Link
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Provide a direct photo URL. Photo will appear with glowing cutout on your 3D card.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Player Card...' : 'Save & Broadcast FUT Card'}
            </button>
          </form>
        </div>

        {/* 3D Holographic FUT Card Live Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
          <div className="text-center mb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              Live 3D Holographic Card Preview
            </span>
            <p className="text-xs text-slate-400 mt-0.5">Move mouse over card for 3D tilt & reflection</p>
          </div>

          <FUTPlayerCard
            player={livePlayerPreview}
            size="lg"
            interactive={true}
            className="neon-glow-platinum"
          />

          <div className="w-full max-w-[320px] p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 text-xs text-slate-400">
            <div className="flex items-center justify-between text-white font-semibold">
              <span>Category Base Tier:</span>
              <span className="text-purple-300 font-mono">{livePlayerPreview.category?.name || 'Platinum Elite'}</span>
            </div>
            <div className="flex items-center justify-between text-white font-semibold">
              <span>Starting Valuation:</span>
              <span className="text-emerald-400 font-mono font-bold">
                ${(livePlayerPreview.category?.basePrice || 5000).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Career & Auction Status Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4">
            <Radio className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white">Auction Lot Status</h4>
          <p className="text-xs text-slate-400">
            {existingPlayer?.isSold
              ? `Sold to ${existingPlayer.team?.name} for $${existingPlayer.finalAuctionPrice?.toLocaleString()}`
              : 'Registered in the active player draft pool. Waiting for live podium pull.'}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4">
            <Trophy className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white">Tournament Readiness</h4>
          <p className="text-xs text-slate-400">
            Verified status active. All match day stats, goals, and cards will track in real-time.
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white">Franchise Affiliation</h4>
          <p className="text-xs text-slate-400">
            {existingPlayer?.team
              ? `${existingPlayer.team.name} (${existingPlayer.team.code})`
              : 'Unassigned Free Agent (Available in Auction)'}
          </p>
        </div>
      </div>
    </div>
  );
};
