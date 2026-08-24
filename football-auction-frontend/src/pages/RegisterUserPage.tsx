import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Lock,
  Mail,
  User,
  ShieldAlert,
  CheckCircle2,
  Crown,
  Gavel,
  Shield,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { Role } from '../types';

export const RegisterUserPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('PLAYER');
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roleOptions: { key: Role; label: string; sub: string; icon: any; color: string; border: string; bg: string }[] = [
    {
      key: 'SUPER_ADMIN',
      label: 'Super Admin',
      sub: 'Event Manager & System Controller',
      icon: Crown,
      color: 'text-amber-400',
      border: 'border-amber-500/50',
      bg: 'bg-amber-500/10',
    },
    {
      key: 'ADMIN',
      label: 'Podium Admin',
      sub: 'The Auctioneer (Phase 3 Stage Controller)',
      icon: Gavel,
      color: 'text-purple-400',
      border: 'border-purple-500/50',
      bg: 'bg-purple-500/10',
    },
    {
      key: 'TEAM_OWNER',
      label: 'Team Manager',
      sub: 'Franchise Owner & Bidding Manager',
      icon: Shield,
      color: 'text-indigo-400',
      border: 'border-indigo-500/50',
      bg: 'bg-indigo-500/10',
    },
    {
      key: 'PLAYER',
      label: 'League Player',
      sub: 'Athlete Registration & Match Tracking',
      icon: User,
      color: 'text-emerald-400',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/10',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setInfoMsg(null);
      const res = await api.post('/auth/register', { email, password, fullName, role });

      if (res.data.data.token) {
        login(res.data.data.token, res.data.data.user);
        navigate('/');
      } else {
        setInfoMsg(
          res.data.message ||
            `Your registration as ${role} has been submitted! A Super Admin must approve your account before you can log in.`
        );
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server. Make sure backend is running on port 5001 (npm run dev inside football-auction-backend).');
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12">
      <div className="glass-card p-8 md:p-10 rounded-3xl border border-purple-500/30 w-full max-w-xl space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/40 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Join the Premier League</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Create an Account</h2>
          <p className="text-xs text-slate-400">Select your role in the University Football Franchise</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <span>Registration Submitted for Super Admin Approval</span>
            </div>
            <p className="leading-relaxed text-slate-300">{infoMsg}</p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold hover:bg-amber-500/30 transition-all text-xs"
              >
                <span>Return to Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {!infoMsg && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Cristiano Ronaldo"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cr7@premier.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Role Selection Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase text-slate-400">Select Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = role === opt.key;

                  return (
                    <div
                      key={opt.key}
                      onClick={() => setRole(opt.key)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? `${opt.bg} ${opt.border} shadow-lg shadow-purple-900/30 scale-[1.02]`
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected ? `${opt.bg} ${opt.color}` : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {opt.label}
                          </h4>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">{opt.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Policy Notice */}
            {role !== 'SUPER_ADMIN' ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Approval Required:</strong> Registrations for <strong>{role}</strong> must be approved by the Super Admin before you can log in.
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>Instant Access:</strong> Super Admin accounts are granted instant activation and dashboard access.
                </span>
              </div>
            )}

            {/* Premium Submit Button with Gradient Glow */}
            <button
              type="submit"
              disabled={loading}
              className="relative group w-full py-4 rounded-2xl text-white font-black text-sm shadow-2xl transition-all disabled:opacity-50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 group-hover:from-purple-500 group-hover:via-pink-500 group-hover:to-indigo-500 transition-all duration-300 shadow-xl shadow-purple-600/40" />
              <div className="relative flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : `Sign Up as ${role.replace('_', ' ')}`}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 font-bold hover:underline">
            Log in here &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
};
