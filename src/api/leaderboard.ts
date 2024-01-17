import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo";
import { Board } from "../board";
import { leaderboardView } from "../view/leaderboard";
import { SlackService } from "../slackService";

export const leaderboard: (
  app: App
) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const channelId = command.channel_id;
    const service = new SlackService(app);
    const humanMembers = await service.getHumanMembers(channelId);
    if (!humanMembers?.length) throw new Error();

    const games = await DB.getLeaderboard();
    const roundMap: Record<string, { userId: string; score: number }[]> = {};
    const winMap: Record<string, number> = {};
    games.forEach((game) => {
      if (!(game.roundId in roundMap)) roundMap[game.roundId] = [];
      roundMap[game.roundId].push({
        score: game.leaderboardInfo()!.score,
        userId: game.userId,
      });
    });
    Object.values(roundMap).forEach((round) => {
      const max = Math.max(...round.map(({ score }) => score));
      round.forEach(({ userId, score }) => {
        if (score === max) {
          if (!(userId in winMap)) winMap[userId] = 0;
          winMap[userId]++;
        }
      });
    });
    return await respond({
      response_type: "in_channel",
      blocks: leaderboardView(
        humanMembers
          .map(({ id, profile }) => {
            const { display_name, image_24 } = profile!;
            const userGames = games.filter(({ userId }) => userId === id);
            const leaderboardAggs = userGames
              .map((game) => game.leaderboardInfo()!)
              .reduce(
                (
                  {
                    numGames,
                    totalScore,
                    cactpots,
                    cactpotsMissed,
                    bestsAchieved,
                  },
                  { score, cactpotPossible, bestScore }
                ) => {
                  return {
                    numGames: numGames + 1,
                    totalScore: score + totalScore,
                    cactpots: cactpots + Number(score === Board.cactpot),
                    cactpotsMissed:
                      cactpotsMissed +
                      Number(cactpotPossible && score != Board.cactpot),
                    bestsAchieved: bestsAchieved + Number(score == bestScore),
                  };
                },
                {
                  numGames: 0,
                  totalScore: 0,
                  cactpots: 0,
                  cactpotsMissed: 0,
                  bestsAchieved: 0,
                }
              );

            return {
              wins: winMap[id!],
              name: display_name!,
              image: image_24!,
              ...leaderboardAggs,
            };
          })
          .sort(({ wins: winsA }, { wins: winsB }) => winsB - winsA)
      ),
    });
  };
