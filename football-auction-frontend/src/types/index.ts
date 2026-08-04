export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_OWNER' | 'PLAYER' | 'PUBLIC_GUEST';
export type Phase = 'SETUP' | 'PLAYER_REGISTRATION' | 'LIVE_AUCTION' | 'LIVE_TOURNAMENT';
export type AuctionType = 'NORMAL' | 'BLIND';
export type AuctionStatus = 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'UNSOLD';
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'COMPLETED' | 'POSTPONED';
export type Position = 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
}

export interface GlobalState {
  id: string;
  activePhase: Phase;
  currentSeasonId?: string;
  isMaintenance: boolean;
  updatedAt: string;
}

export interface PlayerCategory {
  id: string;
  name: string;
  basePrice: number;
  minBidIncrement: number;
  maxPlayersPerTeam: number;
}

export interface Player {
  id: string;
  userId: string;
  seasonId: string;
  categoryId?: string;
  position: Position;
  secondaryPosition?: Position;
  jerseyNumber?: number;
  registrationStatus: RegistrationStatus;
  rejectionReason?: string;
  isSold: boolean;
  finalAuctionPrice?: number;
  teamId?: string;
  user: User;
  category?: PlayerCategory;
  team?: { id: string; name: string; code: string; logoUrl?: string };
}

export interface TeamWallet {
  id: string;
  allocatedBudget: number;
  spentAmount: number;
  currentBalance: number;
  maxPlayerLimit: number;
  playersBoughtCount: number;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  owner: User;
  wallet?: TeamWallet;
  players?: Player[];
}

export interface AuctionSession {
  id: string;
  seasonId: string;
  playerId: string;
  auctionType: AuctionType;
  status: AuctionStatus;
  currentBid: number;
  currentWinnerId?: string;
  timerSeconds: number;
  player: Player;
}

export interface AuctionBid {
  id: string;
  auctionSessionId: string;
  teamId: string;
  amount: number;
  createdAt: string;
  team: { id: string; name: string; code: string; logoUrl?: string };
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  roundName?: string;
  homeTeam: { name: string; code: string; logoUrl?: string };
  awayTeam: { name: string; code: string; logoUrl?: string };
}

export interface Standings {
  id: string;
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  team: { id: string; name: string; code: string; logoUrl?: string };
}
