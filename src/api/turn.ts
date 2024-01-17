import {
  App,
  Middleware,
  SlackActionMiddlewareArgs,
  ButtonAction,
} from "@slack/bolt";
import * as DB from "../mongo";
import { Cactpot } from "../cactpot";
import { SlackService } from "../slackService";
import { cactpotView } from "../view/game";
import { roundEndView } from "../view/roundEnd";
import { Turn } from "../constants";

export const takeTurn: (app: App) => Middleware<SlackActionMiddlewareArgs> =
  (app: App) =>
  async ({ action, body, respond }) => {
    const service = new SlackService(app);
    const channelId = body?.channel?.id as string;
    const { value, gameId } = JSON.parse((action as ButtonAction).value);
    let game: Cactpot;
    try {
      game = await DB.takeTurn(gameId, value);
    } catch (e) {
      return;
    }
    await respond({
      replace_original: true,
      blocks: cactpotView(game.getSummary()),
    });

    const games = await DB.getGamesByRound(game.roundId);
    if (!games?.length) throw new Error();
    if (games.every((game) => game.getCurrentTurn() === Turn.FINAL)) {
      const games = await DB.getGamesByRound(game.roundId);
      const humanMembers = await service.getHumanMembers(channelId);
      if (games.length === humanMembers.length) {
        await DB.finalizeRound(game.roundId);
      }
      const blocks = roundEndView(
        // @ts-ignore
        games.map((g) => ({
          ...humanMembers.find(({ id }) => id === g.userId),
          ...g.getSummary(),
        }))
      );
      await app.client.chat.postMessage({
        channel: channelId,
        blocks,
      });
    }
  };
