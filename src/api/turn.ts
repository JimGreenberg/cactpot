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
    if (!gameId) throw new Error();
    if (!value) throw new Error();

    let game: Cactpot;
    try {
      game = await DB.takeTurn(gameId, value);
    } catch (e) {
      game = await DB.getGameById(gameId);
    }
    if (!game) return;

    await respond({
      replace_original: true,
      blocks: cactpotView(game.getSummary()),
    });

    const games = await DB.getGamesByRound(game.roundId);
    if (!games?.length) throw new Error();
    if (games.every((game) => game.getCurrentTurn() === Turn.FINAL)) {
      const users = await service.getUsers(channelId);
      if (games.length === users.length) {
        await DB.enableLeaderboardForRound(game.roundId);
      }
      const blocks = roundEndView(
        games.map((g) => {
          const { name, image } = users.find(({ id }) => id === g.userId)!;
          return {
            name,
            image,
            ...g.getSummary(),
          };
        })
      );
      await app.client.chat.postMessage({
        channel: channelId,
        blocks,
      });
    }
  };
