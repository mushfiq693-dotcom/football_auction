export const SOCKET_EVENTS = {
  // Auction Events
  BID_PLACE: 'bid:place',
  BID_BROADCAST: 'bid:broadcast',
  BID_ERROR: 'bid:error',
  AUCTION_TIMER_TICK: 'auction:timer_tick',
  AUCTION_STATE_CHANGE: 'auction:state_change',
  AUCTION_SOLD: 'auction:sold',
  AUCTION_UNSOLD: 'auction:unsold',
  AUCTION_PAUSE: 'auction:pause',
  AUCTION_RESUME: 'auction:resume',
  AUCTION_ROLLBACK: 'auction:rollback',

  // Global Phase Events
  PHASE_CHANGED: 'phase:changed',

  // Match Events
  MATCH_SCORE_UPDATE: 'match:score_update',
  MATCH_STATUS_CHANGE: 'match:status_change',
  STANDINGS_UPDATE: 'standings:update',

  // Room Join/Leave Events
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
} as const;

export const SOCKET_ROOMS = {
  PUBLIC: 'room:public',
  AUCTION: 'room:auction',
  ADMIN: 'room:admin',
  TEAM: (teamId: string) => `room:team:${teamId}`,
  MATCH: (matchId: string) => `room:match:${matchId}`,
} as const;
