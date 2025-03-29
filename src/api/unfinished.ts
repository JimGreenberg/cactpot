import {
  App,
  Middleware,
  SlackCommandMiddlewareArgs,
  SlackActionMiddlewareArgs,
} from "@slack/bolt";
import * as DB from "../mongo";
import { cactpotFullWidth } from "../view/cactpotFullWidth";

export const unfinished: (
  app: App
) => Middleware<SlackCommandMiddlewareArgs | SlackActionMiddlewareArgs> =
  (app: App) =>
  async ({ body, respond }) => {
    const channelId =
      // @ts-ignore
      body.command?.channel_id ||
      body.channel?.id ||
      // @ts-ignore
      body.channel_id ||
      // @ts-ignore
      body.channelId;
    const userId =
      // @ts-ignore
      body.command?.user_id || body.user?.id || body?.user_id || body?.userId;
    const game = await DB.getLastUnfinishedGame(userId, channelId);
    if (!game) return await respond("No unfinished games found");

    return await app.client.chat.postEphemeral({
      text: "<!channel> Cactpot has begun!",
      blocks: cactpotFullWidth(game.getSummary()),
      user: userId,
      channel: channelId,
    });
  };
