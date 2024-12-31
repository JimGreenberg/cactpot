import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo";
import { leaderboardView } from "../view/leaderboard";
import { SlackService } from "../slackService";

export const leaderboard: (
  app: App
) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const channelId = command.channel_id;
    const result = /^leaderboard\s(\d{4})$/.exec(command.text);
    const year = result && result[1] ? parseInt(result[1]) : undefined;
    const service = new SlackService(app);
    const leaderboardWithUsers = await service.getLeaderboard(channelId, year);

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
