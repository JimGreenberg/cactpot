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
    S.Context(
      S.Image({ image_url: image, alt_text: name }),
      S.PlainText(name),
      S.Markdown(
        `Wins: *${wins.toLocaleString()}* (${soloWins.toLocaleString()} solo)`
      )
    ),
    S.Context(
      S.Markdown(getScoreBlock("Total Score", totalScore)),
      S.Markdown(getScoreBlock("Zags*", zags)),
      S.Markdown(getScoreBlock(":spicy_keychain:", soloLosses)),
      S.Markdown(getScoreBlock(":dingus:", dingusAwards))
    ),
    S.Context(
      S.Markdown(
        `Best Score Rate: *${Math.floor((100 * bestsAchieved) / countGames)}%*`
      ),
      S.Markdown(
        `Optimal* Play Rate: *${Math.floor(
          (100 * didPlayOptimallyCount) / countGames
        )}%*`
      )
    ),
    S.Context(
      S.Markdown(
        `Achieved *${cactpots}* cactpots out of a possible *${
          cactpots + cactpotsMissed
        }*, meaning he ${
          cactpotsMissed > 0 ? "embarassingly " : ""
        }missed *${cactpotsMissed}*`
      )
    ),
    S.Divider(),
  ];
}
