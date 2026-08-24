import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import {
  LogOut,
  Radio,
  Trophy,
  ChevronDown,
  Sparkles,
  Wallet,
  Settings,
  Users,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activePhase } = useGlobalPhase();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'bg-purple-900/80 text-purple-300 border-purple-500/40';
      case 'PODIUM_ADMIN':
        return 'bg-indigo-900/80 text-indigo-300 border-indigo-500/40';
      case 'TEAM_OWNER':
        return 'bg-amber-900/80 text-amber-300 border-amber-500/40';
      case 'PLAYER':
        return 'bg-emerald-900/80 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base sm:text-lg text-white tracking-tight">GSTU</span>
            <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              PREMIER LEAGUE
            </span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-950/90 border border-purple-500/50 text-purple-300 ml-0.5">
              GPL
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 block -mt-1 tracking-wider uppercase">
            FUT Arena Live • Auction & Fixtures
          </span>
        </div>
      </Link>

      {/* Dynamic Nav Links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
        <Link to="/roster" className="hover:text-purple-400 transition-colors">Players</Link>
        <Link to="/auction" className="hover:text-purple-400 transition-colors">Live Auction</Link>
        <Link to="/tournament" className="hover:text-purple-400 transition-colors">Tournament & News</Link>

        {activePhase === 'PLAYER_REGISTRATION' && (
          <Link to="/player/dashboard" className="text-emerald-400 font-semibold hover:underline flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Player Profile & Card
          </Link>
        )}

        {activePhase === 'LIVE_AUCTION' && (
          <Link to="/auction" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/50 text-purple-300 animate-pulse font-bold">
            <Radio className="w-4 h-4 text-purple-400" />
            Live Auction Room
          </Link>
        )}

        {activePhase === 'LIVE_TOURNAMENT' && (
          <Link to="/tournament" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/30 border border-amber-500/50 text-amber-300 font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
            Tournament Matches
          </Link>
        )}
      </div>

      {/* User Session Actions with Interactive Dropdown */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* Clickable Profile Pill */}
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer group shadow-lg"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  user.fullName?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                {user.fullName}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${getRoleBadgeStyle(user.role)}`}>
                {user.role}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-purple-400' : ''}`} />
            </button>

            {/* Glassmorphism Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-72 rounded-3xl glass-card border border-purple-500/30 shadow-2xl p-2 z-50 animate-fade-in divide-y divide-slate-800">
                {/* User Info Header */}
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        user.fullName?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white truncate">{user.fullName}</h4>
                      <p className="text-xs text-slate-400 truncate font-mono">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Dedicated Role Dashboards */}
                <div className="py-2 space-y-1">
                  {/* Player Dedicated Dashboard */}
                  {user.role === 'PLAYER' && (
                    <Link
                      to="/player/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span>My Player Hub & FUT Card</span>
                        <span className="text-[10px] block text-slate-400 font-normal">Edit profile & live card preview</span>
                      </div>
                    </Link>
                  )}

                  {/* Team Owner Dedicated Dashboard */}
                  {user.role === 'TEAM_OWNER' && (
                    <Link
                      to="/team/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
                    >
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <div>
                        <span>Franchise Management</span>
                        <span className="text-[10px] block text-slate-400 font-normal">Manage purse & acquired squad</span>
                      </div>
                    </Link>
                  )}

                  {/* Admin Dedicated Panel */}
                  {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <div>
                        <span>Super Admin Console</span>
                        <span className="text-[10px] block text-slate-400 font-normal">Rules, teams, phases & nuke resets</span>
                      </div>
                    </Link>
                  )}

                  {/* Podium Admin Quick Link */}
                  {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PODIUM_ADMIN') && (
                    <Link
                      to="/auction"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                    >
                      <Radio className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span>Podium Auction Stage</span>
                        <span className="text-[10px] block text-slate-400 font-normal">Stage controller & lot timer</span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Quick Navigation Items */}
                <div className="py-2 space-y-1">
                  <Link
                    to="/roster"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>League Player Roster</span>
                  </Link>

                  <Link
                    to="/tournament"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-slate-400" />
                    <span>Standings & Match Center</span>
                  </Link>
                </div>

                {/* Logout Action */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 transition-all"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
