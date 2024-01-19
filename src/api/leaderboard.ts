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
    const users = await service.getUsers(channelId);
    if (!users?.length) throw new Error();

    const leaderboard = await DB.getLeaderboard(channelId);
    const leaderboardWithUsers = leaderboard.map(({ userId, ...rest }) => {
      const user = users.find(({ id }) => id === userId)!;
      return { ...rest, name: user.name, image: user.image };
    });

    if (!leaderboardWithUsers.length) {
      return await respond({
        response_type: "ephemeral",
        text: "Error finding games :dingus:",
      });
    }

    return await respond({
      response_type: "in_channel",
      blocks: leaderboardView(leaderboardWithUsers),
    });
  };
