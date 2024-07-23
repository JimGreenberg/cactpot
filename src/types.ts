export interface LeaderboardInfo {
  userId: string;
  countGames: number;
  cactpots: number;
  cactpotsMissed: number;
  bestsAchieved: number;
  totalScore: number;
  wins: number;
  losses: number;
  soloWins: number;
  soloLosses: number;
  didPlayOptimallyCount: number;
  zags: number;
  firstPlaceMedals: number;
  secondPlaceMedals: number;
  thirdPlaceMedals: number;
  dingusAwards: number;
}

export interface Avatar {
  name: string;
  image: string;
}
