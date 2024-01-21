import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo";
import { cactpotView } from "../view/game";

export const unfinished: (app: App) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const channelId = command.channel_id;
    const userId = command.user_id;
    const game = await DB.getLastUnfinishedGame(userId, channelId);
    if (!game) return await respond("No unfinished games found");

    return await app.client.chat.postEphemeral({
      text: "<!channel> Cactpot has begun!",
      blocks: cactpotView(game.getSummary()),
      user: userId,
      channel: channelId,
    });
  };
