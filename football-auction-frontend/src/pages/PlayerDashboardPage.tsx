import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Hash,
  CreditCard,
  Calendar,
  UploadCloud,
  Check,
  X,
  FileImage,
} from 'lucide-react';

export const PlayerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingPlayer, setExistingPlayer] = useState<Player | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample avatar presets for quick 1-click photo testing
  const sampleAvatars = [
    {
      label: 'Striker',
      url: 'https://images.unsplash.com/photo-1570498839593-e565b3d7f672?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Midfielder',
      url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Defender',
      url: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Goalkeeper',
      url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const positionOptions: {
    id: Position;
    title: string;
    sub: string;
    icon: string;
    color: string;
    activeBorder: string;
    activeBg: string;
  }[] = [
    {
      id: 'FORWARD',
      title: 'FORWARD',
      sub: 'ST / CF / RW / LW',
      icon: '⚽',
      color: 'text-rose-400',
      activeBorder: 'border-rose-500 shadow-lg shadow-rose-500/20',
      activeBg: 'bg-rose-500/15 text-white',
    },
    {
      id: 'MIDFIELDER',
      title: 'MIDFIELDER',
      sub: 'CAM / CM / CDM',
      icon: '🎯',
      color: 'text-purple-400',
      activeBorder: 'border-purple-500 shadow-lg shadow-purple-500/20',
      activeBg: 'bg-purple-500/15 text-white',
    },
    {
      id: 'DEFENDER',
      title: 'DEFENDER',
      sub: 'CB / LB / RB',
      icon: '🛡️',
      color: 'text-blue-400',
      activeBorder: 'border-blue-500 shadow-lg shadow-blue-500/20',
      activeBg: 'bg-blue-500/15 text-white',
    },
    {
      id: 'GOALKEEPER',
      title: 'GOALKEEPER',
      sub: 'GK / Shot Stopper',
      icon: '🧤',
      color: 'text-emerald-400',
      activeBorder: 'border-emerald-500 shadow-lg shadow-emerald-500/20',
      activeBg: 'bg-emerald-500/15 text-white',
    },
  ];

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
        if (user) {
          setFullName(user.fullName || '');
        }
      } finally {
        setLoading(false);
      }
    }
    loadPlayerData();
  }, [user]);

  // Handle direct file selection
  // Handle direct file selection with high-performance canvas compression
  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    const maxSize = 20 * 1024 * 1024; // 20MB

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > maxSize) {
      setErrorMessage('File size exceeds 20MB limit. Please choose a smaller photo.');
      return;
    }

    setSelectedFile(file);

    // Read and compress image to high-def compact data URL (max 800x800, quality 0.85)
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const rawBase64 = e.target.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            setPhotoUrl(compressedBase64);
          } else {
            setPhotoUrl(rawBase64);
          }
        };
        img.onerror = () => setPhotoUrl(rawBase64);
        img.src = rawBase64;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let finalPhotoUrl = photoUrl;

      // If a new local file was selected, upload it first to backend
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
          const uploadRes = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (uploadRes.data?.data?.url) {
            finalPhotoUrl = uploadRes.data.data.url;
            setPhotoUrl(finalPhotoUrl);
          }
        } catch (uploadErr: any) {
          console.warn('Backend file upload fallback to base64 Data URL:', uploadErr);
          // If cloud upload fails, finalPhotoUrl is already the Base64 Data URL!
        } finally {
          setUploading(false);
        }
      }

      const payload = {
        fullName,
        studentId,
        academicSession,
        jerseyName: jerseyName.toUpperCase() || fullName.toUpperCase(),
        jerseyNumber: parseInt(jerseyNumber, 10) || 10,
        position,
        secondaryPosition: secondaryPosition || undefined,
        photoUrl: finalPhotoUrl || undefined,
      };

      const res = await api.post('/players/register', payload);
      setExistingPlayer(res.data.data);
      setSelectedFile(null);
      setSuccessMessage('🎉 Player profile & 3D FUT Card saved successfully!');
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-lg shadow-purple-900/20">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            Official Player Hub
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Player Dashboard & <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">FUT Card Creator</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Build your high-resolution holographic player card, upload your photo, customize your on-pitch positions, and broadcast live to auction managers.
          </p>
        </div>

        {existingPlayer?.isSold && existingPlayer?.team && (
          <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/50 shadow-xl shadow-emerald-950/40">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-400 block tracking-widest">
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
        <div className="lg:col-span-7 glass-card p-8 md:p-10 rounded-3xl border border-slate-800/80 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Player Details & Media</h3>
                <p className="text-xs text-slate-400 mt-0.5">Card details update live on the right as you customize.</p>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm font-bold flex items-center gap-3 animate-fade-in shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-bold flex items-center gap-3 shadow-lg shadow-red-500/10">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Full Name & Jersey Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Mushfiqur Rahman"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  Jersey Name (Card Title)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={jerseyName}
                    onChange={(e) => setJerseyName(e.target.value)}
                    placeholder="e.g. MUSHFIQ"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm uppercase focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 font-mono shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Student ID & Academic Session */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  Student ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 2020331001"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  Academic Session
                </label>
                <div className="relative">
                  <select
                    value={academicSession}
                    onChange={(e) => setAcademicSession(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer pr-10 shadow-inner"
                  >
                    <option value="2021-2022">Session 2021-2022</option>
                    <option value="2022-2023">Session 2022-2023</option>
                    <option value="2023-2024">Session 2023-2024</option>
                    <option value="2024-2025">Session 2024-2025</option>
                    <option value="2025-2026">Session 2025-2026</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Primary Position Interactive Pill Buttons */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Primary Position (Select One)
                </span>
                <span className="text-[10px] text-purple-400 font-mono font-normal">Required for Auction</span>
              </label>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {positionOptions.map((opt) => {
                  const isSelected = position === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPosition(opt.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `${opt.activeBorder} ${opt.activeBg}`
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{opt.icon}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-md shadow-purple-600/40">
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-black block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {opt.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {opt.sub}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Position & Jersey Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Secondary Position (Optional)
                </label>
                <div className="relative">
                  <select
                    value={secondaryPosition}
                    onChange={(e) => setSecondaryPosition(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer pr-10 shadow-inner"
                  >
                    <option value="">None (Single Position)</option>
                    <option value="FORWARD">FORWARD (Attacker / Winger)</option>
                    <option value="MIDFIELDER">MIDFIELDER (Playmaker / Box-to-Box)</option>
                    <option value="DEFENDER">DEFENDER (Centerback / Fullback)</option>
                    <option value="GOALKEEPER">GOALKEEPER (Keeper)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Jersey Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600 shadow-inner"
                />
              </div>
            </div>

            {/* Direct Image Upload (Drag and Drop / File Picker < 10MB) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-purple-400" />
                  Direct Photo Upload (Less than 10MB)
                </label>
                <span className="text-[10px] text-purple-300 font-mono">PNG, JPG, WEBP (&lt; 10MB)</span>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Dropzone Container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all duration-200 text-center cursor-pointer flex flex-col items-center justify-center gap-3 relative ${
                  isDragOver
                    ? 'border-purple-400 bg-purple-950/40 shadow-xl shadow-purple-500/20 scale-[1.01]'
                    : photoUrl
                    ? 'border-purple-500/40 bg-slate-900/70 hover:border-purple-400/70'
                    : 'border-slate-700 hover:border-purple-500/60 bg-slate-900/50 hover:bg-slate-900/80'
                }`}
              >
                {photoUrl ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-lg flex-shrink-0">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left flex-1 truncate">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <FileImage className="w-4 h-4 text-purple-400" />
                        <span className="truncate">{selectedFile?.name || 'Player Profile Picture'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                        {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Active Image'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPhotoUrl('');
                      }}
                      className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center shadow-lg shadow-purple-600/10">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Click to browse or drag & drop photo here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        High resolution football portraits supported up to 10MB
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Sample Photo Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Or use instant demo portrait:</span>
                {sampleAvatars.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPhotoUrl(av.url);
                    }}
                    className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-purple-600/30 border border-slate-700 hover:border-purple-500/50 text-[11px] font-bold text-slate-300 hover:text-purple-200 transition-all"
                  >
                    {av.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ultra-Stunning CTA Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full group relative py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden disabled:opacity-50 active:scale-[0.98] bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 shadow-purple-600/40 hover:shadow-purple-600/60"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform pointer-events-none" />

                <div className="relative flex items-center justify-center gap-2.5">
                  <Save className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>
                    {uploading
                      ? 'Uploading Image (Less than 10MB)...'
                      : saving
                      ? 'Saving Player Profile...'
                      : 'Save & Broadcast FUT Card'}
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* 3D Holographic FUT Card Live Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-5 lg:sticky lg:top-24">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
              Live 3D Holographic Card Preview
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Hover & move mouse over card to inspect 3D tilt & reflection
            </p>
          </div>

          <FUTPlayerCard
            player={livePlayerPreview}
            size="lg"
            interactive={true}
            className="neon-glow-platinum"
          />

          <div className="w-full max-w-[340px] p-4 rounded-2xl glass-card border border-slate-800 text-center space-y-2 text-xs text-slate-400 shadow-xl">
            <div className="flex items-center justify-between text-white font-semibold">
              <span>Category Base Tier:</span>
              <span className="text-purple-300 font-mono font-bold">{livePlayerPreview.category?.name || 'Platinum Elite'}</span>
            </div>
            <div className="flex items-center justify-between text-white font-semibold">
              <span>Starting Auction Valuation:</span>
              <span className="text-emerald-400 font-mono font-black text-sm">
                ${(livePlayerPreview.category?.basePrice || 5000).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Career & Auction Status Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-purple-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4 shadow-lg shadow-purple-600/20">
            <Radio className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Auction Lot Status</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {existingPlayer?.isSold
              ? `Sold to ${existingPlayer.team?.name} for $${existingPlayer.finalAuctionPrice?.toLocaleString()}`
              : 'Registered in the active player draft pool. Waiting for live podium pull.'}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-amber-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-600/20">
            <Trophy className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Tournament Readiness</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Verified status active. All match day stats, goals, and cards will track in real-time.
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2 hover:border-emerald-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
            <Shield className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Franchise Affiliation</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {existingPlayer?.team
              ? `${existingPlayer.team.name} (${existingPlayer.team.code})`
              : 'Unassigned Free Agent (Available in Auction)'}
          </p>
        </div>
      </div>
    </div>
  );
};
