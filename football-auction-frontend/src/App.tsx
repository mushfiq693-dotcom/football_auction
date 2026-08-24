import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import { Navbar } from './components/Navbar';
import { PhaseBanner } from './components/PhaseBanner';
import { LandingPage } from './pages/LandingPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { LiveAuctionPage } from './pages/LiveAuctionPage';
import { TournamentPage } from './pages/TournamentPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterUserPage } from './pages/RegisterUserPage';
import { PlayerRosterPage } from './pages/PlayerRosterPage';
import { PlayerDashboardPage } from './pages/PlayerDashboardPage';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { PresentationPage } from './pages/PresentationPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <GlobalStateProvider>
            <BrowserRouter>
              <div className="min-h-screen text-white flex flex-col font-sans relative selection:bg-cyan-500 selection:text-slate-950">
                <PhaseBanner />
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterUserPage />} />
                    <Route path="/register-player" element={<RegistrationPage />} />
                    <Route path="/player/dashboard" element={<PlayerDashboardPage />} />
                    <Route path="/team/dashboard" element={<TeamDashboardPage />} />
                    <Route path="/roster" element={<PlayerRosterPage />} />
                    <Route path="/auction" element={<LiveAuctionPage />} />
                    <Route path="/tournament" element={<TournamentPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/presentation" element={<PresentationPage />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </GlobalStateProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
