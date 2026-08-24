import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalPhase } from '../contexts/GlobalStateContext';
import { api } from '../services/api';
import {
  LogOut,
  Radio,
  Trophy,
  ChevronDown,
  Sparkles,
  Wallet,
  Settings,
  Users,
  Bell,
  CheckCheck,
  ExternalLink,
  Shield,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activePhase } = useGlobalPhase();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Super Admin Notifications State
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s auto-poll
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead && notif.id && !notif.id.startsWith('sys-')) {
        await api.patch(`/notifications/${notif.id}/read`);
      }
      setNotificationsOpen(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error(err);
      if (notif.link) navigate(notif.link);
    }
  };

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
        <Link to="/roster" className="hover:text-purple-400 transition-colors font-semibold">
          Players
        </Link>
        <Link to="/tournament" className="hover:text-purple-400 transition-colors font-semibold">
          Tournament & News
        </Link>

        {activePhase === 'PLAYER_REGISTRATION' && (
          <Link
            to="/player/dashboard"
            className="text-emerald-400 font-semibold hover:underline flex items-center gap-1 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Player Profile & Card
          </Link>
        )}

        {/* Prominent Live Auction Room Button - Always Available */}
        <Link
          to="/auction"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/50 text-purple-300 hover:text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all group cursor-pointer"
        >
          <Radio className="w-4 h-4 text-purple-400 animate-pulse group-hover:scale-110 transition-transform" />
          <span>Live Auction Room</span>
        </Link>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3.5">
        {/* Super Admin & User Notifications Popover */}
        {user && (
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                fetchNotifications();
              }}
              className="relative p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-purple-500/60 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
              title="System Notifications & Alerts"
            >
              <Bell className="w-4 h-4 text-purple-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[9px] font-black text-white shadow-lg shadow-red-500/40 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Glassmorphic Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl glass-card border border-purple-500/40 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Notifications & Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-500/40">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-slate-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                  {notifications.length > 0 ? (
                    notifications.map((n, idx) => (
                      <div
                        key={n.id || idx}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          !n.isRead
                            ? 'bg-purple-950/40 border-purple-500/40 hover:bg-purple-900/40'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />}
                            {n.title}
                          </h5>
                          {n.link && <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                        <span className="text-[9px] font-mono text-slate-500 block mt-1.5">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No notifications or pending alerts at this moment.
                    </div>
                  )}
                </div>

                {/* Admin Console Shortcut */}
                {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                  <div className="pt-2 border-t border-slate-800">
                    <Link
                      to="/admin"
                      onClick={() => setNotificationsOpen(false)}
                      className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Open Super Admin Command Center
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Session Actions with Interactive Dropdown */}
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
