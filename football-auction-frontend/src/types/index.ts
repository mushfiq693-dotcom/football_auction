export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PODIUM_ADMIN' | 'TEAM_OWNER' | 'PLAYER' | 'PUBLIC_GUEST';
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
  isAdminApproved?: boolean;
  avatarUrl?: string;
  phone?: string;
  createdAt?: string;
  teamOwner?: Team;
  playerProfile?: Player;
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
  studentId?: string;
  academicSession?: string;
  jerseyName?: string;
  photoUrl?: string;
  photoPublicId?: string;
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

export interface DynamicIncrements {
  minRaise: number;
  nextMinimumBid: number;
  suggestedIncrements: number[];
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
  dynamicIncrements?: DynamicIncrements;
}

export interface AuctionBid {
  id: string;
  auctionSessionId: string;
  teamId: string;
  amount: number;
  isBlindBid?: boolean;
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
  isTwoLegged?: boolean;
  homeScore: number;
  awayScore: number;
  aggregateHomeScore?: number;
  aggregateAwayScore?: number;
  roundName?: string;
  homeTeam: { id?: string; name: string; code: string; logoUrl?: string };
  awayTeam: { id?: string; name: string; code: string; logoUrl?: string };
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

export interface PlayerStatLeader {
  playerId: string;
  fullName: string;
  teamName: string;
  teamCode: string;
  avatarUrl?: string | null;
  position: Position;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

export interface TournamentStatistics {
  topScorers: PlayerStatLeader[];
  topAssists: PlayerStatLeader[];
  cleanSheets: PlayerStatLeader[];
  cardsLeaderboard: PlayerStatLeader[];
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
}

