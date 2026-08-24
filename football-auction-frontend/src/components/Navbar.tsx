import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activePhase } = useGlobalPhase();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Close menus on outside click or route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
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

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <nav className="glass-card sticky top-0 z-50 border-b border-cyan-500/20 backdrop-blur-2xl bg-slate-950/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 w-full">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg text-white tracking-tight">GSTU</span>
              <span className="font-black text-base sm:text-lg bg-gradient-to-r from-white via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
                PREMIER LEAGUE
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 ml-0.5">
                GPL
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-300 block -mt-1 tracking-wider uppercase">
              FUT Arena Live • Auction & Fixtures
            </span>
          </div>
        </Link>

        {/* Center: 3 Navigation Pill Buttons (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-black uppercase tracking-wider">
          {/* 1. Players & Roster Pill */}
          <Link
            to="/roster"
            className={`btn-shine flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer group shadow-lg ${
              isActiveRoute('/roster')
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/40 ring-2 ring-emerald-400 font-black'
                : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-emerald-500/30 hover:border-emerald-400/60 shadow-emerald-500/10'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Players & Roster</span>
          </Link>

          {/* 2. Live Auction Room Pill */}
          <Link
            to="/auction"
            className={`btn-shine flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer group shadow-lg ${
              isActiveRoute('/auction')
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-cyan-500/40 ring-2 ring-cyan-400 font-black'
                : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-cyan-500/30 hover:border-cyan-400/60 shadow-cyan-500/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse group-hover:scale-110 transition-transform" />
            <span>Live Auction Room</span>
          </Link>

          {/* 3. Tournament & News Pill */}
          <Link
            to="/tournament"
            className={`btn-shine flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer group shadow-lg ${
              isActiveRoute('/tournament')
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-amber-500/40 ring-2 ring-amber-300 font-black'
                : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-amber-500/30 hover:border-amber-400/60 shadow-amber-500/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Tournament & News</span>
          </Link>

          {/* Optional: Player Registration Link */}
          {activePhase === 'PLAYER_REGISTRATION' && (
            <Link
              to="/player/dashboard"
              className="btn-shine text-emerald-300 hover:text-white flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Player Card</span>
            </Link>
          )}
        </div>

        {/* Right Header Action Group */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          {/* Super Admin & User Notifications Popover */}
          {user && (
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  fetchNotifications();
                }}
                className="relative p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/60 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
                title="System Notifications & Alerts"
              >
                <Bell className="w-4 h-4 text-cyan-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[9px] font-black text-white shadow-lg shadow-red-500/40 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl glass-card border border-cyan-500/40 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Notifications & Alerts
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
                          {unreadCount} New
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                    {notifications.length > 0 ? (
                      notifications.map((n, idx) => (
                        <div
                          key={n.id || idx}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            !n.isRead
                              ? 'bg-cyan-950/40 border-cyan-500/40 hover:bg-cyan-900/40'
                              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                              {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
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

                  {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                    <div className="pt-2 border-t border-slate-800">
                      <Link
                        to="/admin"
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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

          {/* User Profile Pill / Auth Actions */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-lg"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    user.fullName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors max-w-[90px] truncate hidden md:inline">
                  {user.fullName}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${getRoleBadgeStyle(user.role)} hidden sm:inline`}>
                  {user.role}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-3xl glass-card border border-cyan-500/30 shadow-2xl p-2 z-50 animate-fade-in divide-y divide-slate-800">
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
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
                    {user.role === 'PLAYER' && (
                      <Link
                        to="/player/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span>My Player Hub & FUT Card</span>
                          <span className="text-[10px] block text-slate-400 font-normal">Edit profile & live card</span>
                        </div>
                      </Link>
                    )}

                    {user.role === 'TEAM_OWNER' && (
                      <Link
                        to="/team/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
                      >
                        <Wallet className="w-4 h-4 text-amber-400" />
                        <div>
                          <span>Franchise Management</span>
                          <span className="text-[10px] block text-slate-400 font-normal">Manage purse & squad</span>
                        </div>
                      </Link>
                    )}

                    {user.role === 'SUPER_ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-cyan-400" />
                        <div>
                          <span>Super Admin Console</span>
                          <span className="text-[10px] block text-slate-400 font-normal">Rules, teams, phases & nukes</span>
                        </div>
                      </Link>
                    )}

                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PODIUM_ADMIN') && (
                      <Link
                        to="/auction"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <div>
                          <span>Podium Stage Controller</span>
                          <span className="text-[10px] block text-slate-400 font-normal">Live lot timer, overrides & hammer</span>
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

                    <Link
                      to="/presentation"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Judges Presentation Slides</span>
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-cyan-300 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-shine px-4 py-2 text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-xl shadow-lg shadow-cyan-500/30 border border-cyan-300/40 transition-all cursor-pointer"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle (Visible on < lg screens) */}
          <div className="lg:hidden" ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Drawer Dropdown */}
            {mobileMenuOpen && (
              <div className="absolute left-4 right-4 top-16 rounded-3xl glass-card border border-cyan-500/40 p-4 shadow-2xl z-50 space-y-2.5 animate-fade-in">
                <div className="flex flex-col space-y-2 text-xs font-black uppercase tracking-wider">
                  <Link
                    to="/roster"
                    className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/30 text-slate-200 hover:text-white flex items-center gap-2.5"
                  >
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Players & Roster</span>
                  </Link>

                  <Link
                    to="/auction"
                    className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/30 text-slate-200 hover:text-white flex items-center gap-2.5"
                  >
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>Live Auction Room</span>
                  </Link>

                  <Link
                    to="/tournament"
                    className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-slate-200 hover:text-white flex items-center gap-2.5"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Tournament & News</span>
                  </Link>

                  {activePhase === 'PLAYER_REGISTRATION' && (
                    <Link
                      to="/player/dashboard"
                      className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Player Profile & 3D Card</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
