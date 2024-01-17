import { getScoreBlock } from "./util";
import * as S from "./slack";

interface LeaderboardInfo {
  name: string;
  image: string;
  countGames: number;
  cactpots: number;
  cactpotsMissed: number;
  wins: number;
  bestsAchieved: number;
}

export function leaderboardView(users: LeaderboardInfo[]) {
  return [
    S.Header(S.PlainText("Leaderboard")),
    S.Section(S.PlainText(`${users[0].countGames} rounds played`)),
    S.Divider(),
    ...users.map(leaderboardUserView).flat(1),
  ];
}

function leaderboardUserView({
  name,
  image,
  cactpots,
  cactpotsMissed,
  wins,
  bestsAchieved,
  countGames,
}: LeaderboardInfo) {
  return [
    S.Context(S.Image({ image_url: image, alt_text: name }), S.PlainText(name)),
    S.Context(
      S.Markdown(getScoreBlock("Wins", wins)),
      S.Markdown(
        `Best Score Rate: *${Math.floor((100 * bestsAchieved) / countGames)}%*`
      ),
      S.Markdown(getScoreBlock("Cactpots", cactpots)),
      S.Markdown(getScoreBlock("Cactpots Missed", cactpotsMissed))
    ),
    S.Divider(),
  ];
}
