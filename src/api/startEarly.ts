import {
  App,
  Middleware,
  SlackActionMiddlewareArgs,
  ButtonAction,
} from "@slack/bolt";
import * as DB from "../mongo";
import { SlackService } from "../slackService";

export const startEarly: (app: App) => Middleware<SlackActionMiddlewareArgs> =
  (app: App) =>
  async ({ action, body, respond, ack }) => {
    const service = new SlackService(app);
    const channelId = body?.channel?.id as string;
    const { roundId } = JSON.parse((action as ButtonAction).value);
    const games = await DB.getGamesByRound(roundId);
    if (!games?.length) throw new Error();
    await service.beginRound(respond, channelId, games);
  };
