import { getScoreBlock } from "./util";
import * as S from "./slack";

interface LeaderboardInfo {
  name: string;
  image: string;
  countGames: number;
  cactpots: number;
  cactpotsMissed: number;
  wins: number;
  soloWins: number;
  soloLosses: number;
  bestsAchieved: number;
  totalScore: number;
  /** a dingus award is the ultimate humiliation */
  dingusAwards: number;
  didPlayOptimallyCount: number;
  zags: number;
}

export function leaderboardView(users: LeaderboardInfo[]) {
  return [
    S.Header(S.PlainText("Leaderboard *")),
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
  soloWins,
  soloLosses,
  totalScore,
  bestsAchieved,
  countGames,
  dingusAwards,
  didPlayOptimallyCount,
  zags,
}: LeaderboardInfo) {
  return [
    S.Context(S.Image({ image_url: image, alt_text: name }), S.PlainText(name)),
    S.Context(
      S.Markdown(
        `Wins: *${wins.toLocaleString()} (${soloWins.toLocaleString()} solo)*`
      ),
      S.Markdown(getScoreBlock("Zags*", zags)),
      S.Markdown(getScoreBlock(":spicy_keychain:", soloLosses)),
      S.Markdown(getScoreBlock(":dingus: Awards", dingusAwards)),
      S.Markdown(getScoreBlock("Total Score", totalScore)),
      S.Markdown(
        `Best Score Rate: *${Math.floor((100 * bestsAchieved) / countGames)}%*`
      ),
      S.Markdown(
        `Optimal* Play Rate: *${Math.floor(
          (100 * didPlayOptimallyCount) / countGames
        )}%*`
      ),
      S.Markdown(
        `Cactpots: *achieved ${cactpots} cactpots out of a possible ${
          cactpots + cactpotsMissed
        }, meaning he ${
          cactpotsMissed > 0 ? "embarassingly " : ""
        }missed ${cactpotsMissed}*`
      )
    ),
    S.Divider(),
  ];
}
