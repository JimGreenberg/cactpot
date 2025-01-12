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
    const result = /^leaderboard\s(\d{4}|all)$/.exec(command.text);
    let year;
    if (result && result[1]) {
      if (result[1] === "all") year = "all" as const;
      else year = parseInt(result[1]);
    }
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
      blocks: leaderboardView(leaderboardWithUsers, year),
    });
  };
