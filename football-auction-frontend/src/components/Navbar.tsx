import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { Shield, User, LogOut, Radio, Trophy } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activePhase } = useGlobalPhase();
  const navigate = useNavigate();

  return (
    <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-lg text-white tracking-tight">PREMIER</span>
          <span className="font-bold text-lg text-purple-400 ml-1">AUCTION</span>
        </div>
      </Link>

      {/* Dynamic Nav Links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
        <Link to="/roster" className="hover:text-purple-400 transition-colors">Players</Link>
        
        {activePhase === 'PLAYER_REGISTRATION' && (
          <Link to="/register-player" className="text-emerald-400 font-semibold hover:underline">
            Register Player
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

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <Link to="/admin" className="flex items-center gap-1 text-slate-400 hover:text-white">
            <Shield className="w-4 h-4 text-purple-400" />
            Admin Panel
          </Link>
        )}
      </div>

      {/* User Session Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-200">{user.fullName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
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
