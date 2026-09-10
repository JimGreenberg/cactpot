import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { leaderboardView } from "../view/leaderboard";
import { SlackService } from "../slackService";
import {
  LEADERBOARD_RANGE_HELP,
  parseLeaderboardRange,
} from "../leaderboardRange";

export const leaderboard: (
  app: App
) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const channelId = command.channel_id;
    const result = command.text.replace("leaderboard", "").trim();
    console.log(result);

    const parsed = parseLeaderboardRange(result);
    if (!parsed) {
      return await respond({
        response_type: "ephemeral",
        text: `Unknown leaderboard range \`${result}\`. ${LEADERBOARD_RANGE_HELP}`,
      });
    }

    const service = new SlackService(app);
    const leaderboardWithUsers = await service.getLeaderboard(
      channelId,
      parsed.options
    );

    if (!leaderboardWithUsers.length) {
      return await respond({
        response_type: "ephemeral",
        text: "Error finding games :dingus:",
      });
    }

    return await respond({
      response_type: "in_channel",
      blocks: leaderboardView(leaderboardWithUsers, parsed.title),
    });
  };
