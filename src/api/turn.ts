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
import { inProgressRound } from "../view/inProgressRound";

export const takeTurn: (app: App) => Middleware<SlackActionMiddlewareArgs> =
  (app: App) =>
  async ({ action, body, respond }) => {
    const service = new SlackService(app);
    const channelId = body?.channel?.id as string;
    const { value, gameId, roundMessageTs } = JSON.parse(
      (action as ButtonAction).value
    );

    let game: Cactpot;
    try {
      game = await DB.takeTurn(gameId, value);
    } catch (e) {
      game = await DB.getGameById(gameId);
    }
    if (!game) return;

    await respond({
      replace_original: true,
      blocks: cactpotView(game.getSummary(), roundMessageTs),
    });

    const games = await DB.getGamesByRound(game.roundId);
    if (!games?.length) throw new Error();
    const users = await service.getUsers(channelId);
    if (!users?.length) throw new Error();
    let blocks = [];

    if (games.some((game) => game.getCurrentTurn() !== Turn.FINAL)) {
      blocks = inProgressRound(
        games.map((g) => {
          const user = users.find(({ id }) => id === g.userId);
          return {
            turn: g.getCurrentTurn(),
            name: user?.profile?.display_name!,
            image: user?.profile?.image_24!,
          };
        })
      );
    } else {
      if (games.length === users.length) {
        await DB.enableLeaderboardForRound(game.roundId);
      }
      blocks = roundEndView(
        // @ts-ignore
        games.map((g) => ({
          ...users.find(({ id }) => id === g.userId),
          ...g.getSummary(),
        }))
      );
    }
    await app.client.chat.update({
      ts: roundMessageTs,
      channel: channelId,
      blocks,
      text: "",
    });
  };
