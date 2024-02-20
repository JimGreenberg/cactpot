import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo";
import { cactpotFullWidth } from "../view/cactpotFullWidth";

export const unfinished: (app: App) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const channelId = command.channel_id;
    const userId = command.user_id;
    const game = await DB.getLastUnfinishedGame(userId, channelId);
    if (!game) return await respond("No unfinished games found");

    return await app.client.chat.postEphemeral({
      text: "<!channel> Cactpot has begun!",
      blocks: cactpotFullWidth(game.getSummary()),
      user: userId,
      channel: channelId,
    });
  };
