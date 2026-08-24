import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trophy,
  Shield,
  Radio,
  Users,
  Sparkles,
  Lock,
  Cpu,
  Layers,
  CheckCircle,
  ExternalLink,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Slide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  content: React.ReactNode;
}

export const PresentationPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoplay, setAutoplay] = useState<boolean>(false);

  const slides: Slide[] = [
    // Slide 1: Title & Hero
    {
      id: 0,
      tag: 'HACKATHON GRAND FINALE',
      title: 'GSTU Premier League (GPL)',
      subtitle: 'Next-Gen Real-Time Sports Auction & Tournament Ecosystem',
      icon: Trophy,
      accentColor: 'from-cyan-400 via-teal-300 to-emerald-400',
      content: (
        <div className="space-y-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-pill border border-cyan-500/40 text-cyan-300 text-sm font-black uppercase tracking-widest shadow-xl animate-pulse">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Official University Sports Tech Innovation</span>
          </div>

          <p className="text-lg md:text-xl text-slate-200 leading-relaxed font-normal">
            A state-of-the-art sports management platform featuring <strong className="text-cyan-300 font-bold">3D FUT Holographic Cards</strong>, a sub-millisecond <strong className="text-emerald-300 font-bold">WebSocket Auction Engine</strong> with anti-chaos purse sentinels, and an <strong className="text-amber-300 font-bold">Automated League Match Center</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="glass-card p-4 rounded-2xl border border-cyan-500/30 text-center">
              <div className="text-2xl font-black text-cyan-300 font-mono">100%</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">Real-Time Sync</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 text-center">
              <div className="text-2xl font-black text-emerald-400 font-mono">3D FUT</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">Holographic Cards</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-amber-500/30 text-center">
              <div className="text-2xl font-black text-amber-400 font-mono">4-Phase</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">State Machine</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-purple-500/30 text-center">
              <div className="text-2xl font-black text-purple-300 font-mono">0.00$</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">Overdraft Guarantee</div>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 2: The Problem
    {
      id: 1,
      tag: 'PROBLEM STATEMENT',
      title: 'The Chaos of Traditional Auctions',
      subtitle: 'Why existing university and club tournaments break down',
      icon: Shield,
      accentColor: 'from-red-400 to-amber-400',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-3xl border border-red-500/30 space-y-3 hover:border-red-500/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-white">Manual Errors & Purse Overdrafts</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Paper ledgers lead to calculation mistakes, teams exceeding budget limits, and chaotic post-auction disqualifications.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-amber-500/30 space-y-3 hover:border-amber-500/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
              ⏱️
            </div>
            <h3 className="text-lg font-bold text-white">Bid Desynchronization & Latency</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Without real-time socket locks, multiple team managers claim the same bid simultaneously, creating disputes and unfair outcomes.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-purple-500/30 space-y-3 hover:border-purple-500/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-xl">
              📉
            </div>
            <h3 className="text-lg font-bold text-white">Zero Spectator Engagement</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Students and fans have no way to watch the auction live, view player ratings, or track fixtures and tournament leaderboards.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 3: The Architecture & 4-Phase State Engine
    {
      id: 2,
      tag: 'SYSTEM ARCHITECTURE',
      title: 'Automated 4-Phase Lifecycle Engine',
      subtitle: 'Strict state-machine governance preventing invalid actions',
      icon: Layers,
      accentColor: 'from-cyan-400 to-teal-400',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-card p-5 rounded-2xl border border-cyan-500/30 space-y-2 text-center">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-black uppercase font-mono border border-cyan-500/40">
              Phase 1
            </span>
            <h4 className="text-sm font-black text-white">Setup & Season Rules</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Franchise slots, starting budgets (৳50,000), minimum squad limits, and tier price caps.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 space-y-2 text-center">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-black uppercase font-mono border border-emerald-500/40">
              Phase 2
            </span>
            <h4 className="text-sm font-black text-white">Registration & Cards</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Students submit profile, position, and Base64 avatar. Super admin evaluates & assigns OVR rating.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-cyan-500/40 space-y-2 text-center shadow-lg shadow-cyan-500/10">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-cyan-300 text-[10px] font-black uppercase font-mono border border-cyan-400 animate-pulse">
              Phase 3 (Core)
            </span>
            <h4 className="text-sm font-black text-white">Live Real-Time Auction</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Podium stage controller drops hammer, 15s lot timer, atomic purse mutex locks, live ledger.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-amber-500/30 space-y-2 text-center">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-black uppercase font-mono border border-amber-500/40">
              Phase 4
            </span>
            <h4 className="text-sm font-black text-white">Tournament Matchday</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Automated 2-legged fixtures, live goal scorers, dynamic points table with GD/GF tiebreakers.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 4: 3D Holographic FUT Cards
    {
      id: 3,
      tag: 'FLAGSHIP INNOVATION',
      title: '3D Holographic FUT Cards',
      subtitle: 'Bringing EA FC / FIFA Ultimate Team magic to university athletes',
      icon: Sparkles,
      accentColor: 'from-cyan-300 via-emerald-300 to-teal-300',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                Physical Gyroscopic Glare & Tilt
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cards react dynamically to cursor movement with 3D perspective transforms (`perspective: 1200px`) and real-time light-sweep sheen.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Tier Radiance (ACE • GOLD • SILVER)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ACE Tier (88+ OVR) shines with cyan foil; GOLD (75-87) with golden foil; SILVER (&lt;75) with metallic slate.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400" />
                Framer Motion Spring Inspection Modal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clicking any card in the roster triggers a high-def 3D modal with animated stat skill bars (PAC, SHO, PAS, DRI, DEF, PHY).
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-cyan-500/40 text-center space-y-3 shadow-2xl">
            <div className="text-5xl">🃏</div>
            <h4 className="text-lg font-black text-white">Dynamic Monogram Fallback</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              If an athlete does not provide a photo or an image link breaks, our smart renderer generates an athletic monogram (e.g. <strong>MU</strong>) with glowing tier backlights so cards never look broken.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 5: Live Real-Time Bidding Engine
    {
      id: 4,
      tag: 'REAL-TIME ENGINE',
      title: 'Anti-Chaos Live Bidding Arena',
      subtitle: 'Sub-millisecond WebSocket synchronization with atomic budget guards',
      icon: Radio,
      accentColor: 'from-cyan-400 to-emerald-400',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              ⚡
            </div>
            <h4 className="text-base font-black text-white">15s Anti-Snipe Lot Timer</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Each new bid resets the timer by +5 seconds, ensuring fair bidding wars without last-second millisecond snipe exploits.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              🛡️
            </div>
            <h4 className="text-base font-black text-white">Atomic Purse Mutex Lock</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Guarantees teams cannot bid beyond remaining purse budget minus minimum reserve needed to fill mandatory roster slots.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-amber-500/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              📜
            </div>
            <h4 className="text-base font-black text-white">Live Event Streaming Ledger</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Spectators and judges watch real-time bid events with audio feedback, hammer drops, confetti, and unread notification alerts.
            </p>
          </div>
        </div>
      ),
    },

    // Slide 6: Automated Tournament & Match Center
    {
      id: 5,
      tag: 'LEAGUE STAGE',
      title: 'Automated Tournament Match Center',
      subtitle: 'Dynamic standings, 2-legged fixtures & golden boot leaderboards',
      icon: Trophy,
      accentColor: 'from-amber-300 to-yellow-400',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-1">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Automated 2-Legged Match Engine
              </h4>
              <p className="text-xs text-slate-300">
                Generates balanced Home & Away fixtures with stadium kick-off times and stage progression.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-1">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Live Points Table & GD/GF Tiebreakers
              </h4>
              <p className="text-xs text-slate-300">
                Instantly recalculates Points (PTS), Goal Difference (GD), and Goals For (GF) whenever match scores are saved.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-1">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Golden Boot & Top Scorer Leaderboard
              </h4>
              <p className="text-xs text-slate-300">
                Tracks individual player goal tallies across matches and awards golden boot rankings dynamically.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-amber-500/40 text-center space-y-3">
            <div className="text-4xl">⚽ 🏆 🥇</div>
            <h4 className="text-lg font-black text-white">Full Post-Auction Continuity</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlike ordinary auction tools that stop when bidding ends, our platform seamlessly transitions drafted squads directly into the live championship league!
            </p>
          </div>
        </div>
      ),
    },

    // Slide 7: Tech Stack & Security
    {
      id: 6,
      tag: 'ENTERPRISE TECH STACK',
      title: 'Full-Stack Architecture & Resilience',
      subtitle: 'Built for high concurrency, zero downtime, and instant responsiveness',
      icon: Cpu,
      accentColor: 'from-cyan-400 via-teal-400 to-emerald-400',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 space-y-4">
            <h4 className="text-base font-black text-cyan-300 flex items-center gap-2">
              <Layers className="w-5 h-5" /> Frontend Architecture
            </h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• <strong>React 19 & TypeScript:</strong> Modern component hierarchy</li>
              <li>• <strong>Tailwind CSS 4 & Vanilla Glassmorphism:</strong> Night stadium aesthetics</li>
              <li>• <strong>Framer Motion:</strong> 3D spring animations & layout transitions</li>
              <li>• <strong>Socket.IO Client:</strong> Low-latency room state syncing</li>
              <li>• <strong>TanStack React Query:</strong> Smart caching & optimistic updates</li>
            </ul>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-4">
            <h4 className="text-base font-black text-emerald-400 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Backend & Database
            </h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• <strong>Node.js & Express (TypeScript):</strong> Clean MVC architecture</li>
              <li>• <strong>Prisma ORM & PostgreSQL:</strong> ACID compliant transactions</li>
              <li>• <strong>WebSocket Mutex Locks:</strong> Race-condition prevention</li>
              <li>• <strong>RBAC Guards:</strong> Super Admin, Podium Admin, Team Owner, Player</li>
              <li>• <strong>JWT & Cascade Cleanup:</strong> Secure multi-tenant authentication</li>
            </ul>
          </div>
        </div>
      ),
    },

    // Slide 8: Live Demo & Walkthrough
    {
      id: 7,
      tag: 'LIVE DEMONSTRATION',
      title: 'Interactive Live Walkthrough',
      subtitle: 'Experience the real-time ecosystem in action right now',
      icon: Play,
      accentColor: 'from-emerald-400 to-cyan-400',
      content: (
        <div className="space-y-6 max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-300">
            Let's walk through the core features with the judges:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/roster"
              target="_blank"
              className="glass-card p-6 rounded-3xl border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex flex-col items-center justify-center space-y-2 group cursor-pointer"
            >
              <Users className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-black text-white">1. FUT Roster & Dossier</h4>
              <span className="text-[11px] text-emerald-300 font-mono flex items-center gap-1">
                Open Page <ExternalLink className="w-3 h-3" />
              </span>
            </Link>

            <Link
              to="/auction"
              target="_blank"
              className="glass-card p-6 rounded-3xl border border-cyan-500/30 hover:border-cyan-400/60 transition-all flex flex-col items-center justify-center space-y-2 group cursor-pointer"
            >
              <Radio className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
              <h4 className="text-sm font-black text-white">2. Live Auction Arena</h4>
              <span className="text-[11px] text-cyan-300 font-mono flex items-center gap-1">
                Open Arena <ExternalLink className="w-3 h-3" />
              </span>
            </Link>

            <Link
              to="/tournament"
              target="_blank"
              className="glass-card p-6 rounded-3xl border border-amber-500/30 hover:border-amber-400/60 transition-all flex flex-col items-center justify-center space-y-2 group cursor-pointer"
            >
              <Trophy className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-black text-white">3. Matchday & Standings</h4>
              <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                Open Standings <ExternalLink className="w-3 h-3" />
              </span>
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 font-mono inline-block">
            Tip: You can navigate between slides using Keyboard Arrow Keys [←] and [→], or press [F] for Fullscreen!
          </div>
        </div>
      ),
    },

    // Slide 9: Conclusion & Q&A
    {
      id: 8,
      tag: 'SUMMARY & Q&A',
      title: 'Ready for Any University League',
      subtitle: 'Scalable to Football, Cricket, Basketball & E-Sports',
      icon: CheckCircle,
      accentColor: 'from-cyan-300 via-teal-300 to-emerald-400',
      content: (
        <div className="space-y-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex p-4 rounded-3xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300">
            <Trophy className="w-12 h-12 animate-bounce" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Thank you, Respected Judges!
          </h3>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            GSTU Premier League (GPL) is fully responsive, production-deployed on Vercel and Render, and ready to revolutionize collegiate athletics.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              to="/"
              className="btn-shine px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/25 hover:-translate-y-0.5 transition-all"
            >
              Enter Main Platform
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autoplay timer
  useEffect(() => {
    let interval: any;
    if (autoplay) {
      interval = setInterval(() => {
        handleNext();
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [autoplay, currentSlide]);

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  return (
    <div className="min-h-screen text-white flex flex-col justify-between p-4 sm:p-8 relative select-none">
      {/* Overhead Spotlight Beam Ray from Stadium Floodlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-400/25 via-emerald-400/12 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30"
          >
            <Trophy className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-cyan-300 font-mono block">
              JUDGES PITCH DECK • GPL ARENA
            </span>
            <span className="text-sm font-bold text-white">GSTU Premier League Showcase</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoplay((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              autoplay
                ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/40'
                : 'bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {autoplay ? 'Pause Auto' : 'Play Auto'}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Slide Card Container with Framer Motion Slide Transition */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex items-center justify-center my-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 0.94, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full glass-card rounded-3xl border border-cyan-500/30 p-6 sm:p-12 shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative overflow-hidden"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Slide Header */}
            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest font-mono">
                <IconComponent className="w-3.5 h-3.5" />
                <span>{slide.tag}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {slide.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl mx-auto">
                {slide.subtitle}
              </p>
            </div>

            {/* Slide Interactive Content */}
            <div className="relative z-10">{slide.content}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4 pt-4 border-t border-cyan-500/20">
        <button
          onClick={handlePrev}
          className="btn-shine px-4 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-slate-200 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-4 h-4 text-cyan-400" />
          <span>Previous</span>
        </button>

        {/* Slide Indicator Dots */}
        <div className="flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx
                  ? 'w-8 bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-md shadow-cyan-500/50'
                  : 'w-2.5 bg-slate-800 hover:bg-slate-700'
              }`}
              title={`Jump to Slide ${idx + 1}: ${s.title}`}
            />
          ))}
          <span className="text-xs font-mono font-bold text-slate-400 ml-2">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="btn-shine px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/30"
        >
          <span>Next Slide</span>
          <ChevronRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    </div>
  );
};
