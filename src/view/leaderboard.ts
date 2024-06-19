import { getScoreBlock } from "./util";
import * as S from "./slack";

interface LeaderboardInfo {
  name: string;
  image: string;
  countGames: number;
  cactpots: number;
  cactpotsMissed: number;
  soloWins: number;
  soloLosses: number;
  bestsAchieved: number;
  totalScore: number;
  didPlayOptimallyCount: number;
  zags: number;
  firstPlaceMedals: number;
  secondPlaceMedals: number;
  thirdPlaceMedals: number;
  /** a dingus award is the ultimate humiliation */
  dingusAwards: number;
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
  soloWins,
  soloLosses,
  totalScore,
  bestsAchieved,
  countGames,
  didPlayOptimallyCount,
  zags,
  firstPlaceMedals,
  secondPlaceMedals,
  thirdPlaceMedals,
  dingusAwards,
}: LeaderboardInfo) {
  return [
    S.Context(
      S.Image({ image_url: image, alt_text: name }),
      S.PlainText(name),
      S.Markdown(getScoreBlock(":first_place_medal:", firstPlaceMedals)),
      S.Markdown(getScoreBlock(":second_place_medal:", secondPlaceMedals)),
      S.Markdown(getScoreBlock(":third_place_medal:", thirdPlaceMedals)),
      S.Markdown(getScoreBlock(":dingus:", dingusAwards))
    ),
    S.Context(
      S.Markdown(getScoreBlock("Cactpots", cactpots)),
      S.Markdown(
        `${getScoreBlock("Cactpots Missed", cactpotsMissed)}${
          cactpotsMissed > 0 ? " (embarassing)" : ""
        }`
      )
    ),
    S.Context(
      S.Markdown(getScoreBlock("Total Score", totalScore)),
      S.Markdown(getScoreBlock("Solo Wins", soloWins)),
      S.Markdown(getScoreBlock("Zags*", zags)),
      S.Markdown(getScoreBlock(":spicy_keychain:", soloLosses)),
      S.Markdown(
        `Best Score Rate: *${Math.floor((100 * bestsAchieved) / countGames)}%*`
      ),
      S.Markdown(
        `Optimal* Play Rate: *${Math.floor(
          (100 * didPlayOptimallyCount) / countGames
        )}%*`
      )
    ),
    S.Divider(),
  ];
}
