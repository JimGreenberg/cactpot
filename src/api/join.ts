import {
  App,
  Middleware,
  SlackActionMiddlewareArgs,
  ButtonAction,
} from "@slack/bolt";
import * as DB from "../mongo";
import { SlackService } from "../slackService";
import { startView } from "../view/start";

export const joinGame: (app: App) => Middleware<SlackActionMiddlewareArgs> =
  (app: App) =>
  async ({ action, body, respond, ack }) => {
    const service = new SlackService(app);
    const channelId = body?.channel?.id as string;
    const { roundId } = JSON.parse((action as ButtonAction).value);

    try {
      await DB.joinGame({
        userId: body.user.id,
        roundId,
      });
    } catch {
      return await respond({
        response_type: "ephemeral",
        text: "You've already joined this Cactpot :dingus:",
        replace_original: false,
      });
    }

    const games = await DB.getGamesByRound(roundId);
    if (!games?.length) throw new Error();
    const users = await service.getUsers(channelId);
    if (games.length >= users.length) {
      return await service.beginRound(respond, channelId, games);
    } else {
      await respond({
        blocks: startView(
          roundId,
          games.map(({ userId }) => users.find(({ id }) => id === userId)!)
        ),
        replace_original: true,
      });
    }
  };
