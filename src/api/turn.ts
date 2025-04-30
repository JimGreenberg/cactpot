import {
  App,
  Middleware,
  SlackActionMiddlewareArgs,
  ButtonAction,
} from "@slack/bolt";
import * as DB from "../mongo";
import { Cactpot } from "../cactpot";
import { SlackService } from "../slackService";
import { cactpotFullWidth } from "../view/cactpotFullWidth";
import { cactpotMobile } from "../view/cactpotMobile";
import { roundEndView } from "../view/roundEnd";
import { gameHasBegun } from "../view/gameHasBegun";
import { Turn } from "../constants";

export const takeTurn: (app: App) => Middleware<SlackActionMiddlewareArgs> =
  (app: App) =>
  async ({ action, body, respond }) => {
    const service = new SlackService(app);
    const channelId = body?.channel?.id as string;
    const userId = body?.user?.id as string;
    const { value, gameId, mobile } = JSON.parse(
      (action as ButtonAction).value
    );
    if (!gameId) throw new Error();

    let game: Cactpot;
    try {
      game = await DB.takeTurn(gameId, value);
    } catch (e) {
      game = await DB.getGameById(gameId);
    }
    if (!game) return;

    await respond({
      replace_original: true,
      blocks: mobile
        ? cactpotMobile(game.getSummary())
        : cactpotFullWidth(game.getSummary()),
    });

    const games = await DB.getGamesByRound(game.roundId);
    if (!games?.length) throw new Error();

    // if all but one game is final
    if (
      games
        .map((game) => Number(game.getCurrentTurn() === Turn.FINAL))
        .reduce((acc, curr) => acc + curr, 0) ===
      games.length - 1
    ) {
      const unfinished = games.find(
        (game) => game.getCurrentTurn() !== Turn.FINAL
      );
      if (unfinished && unfinished.userId !== userId) {
        const users = await service.getUsers(channelId);
        const unfinishedUser = users.find(({ id }) => id === unfinished.userId);
        await app.client.chat.postMessage({
          channel: channelId,
          text: `Everyone is done except <@${unfinished.userId}>`,
          blocks: gameHasBegun(
            `Everyone is done except <@${unfinished.userId}>`,
            `Play (${unfinishedUser?.name || "Losers"} only)`
          ),
        });
      }
    }

    if (games.every((game) => game.getCurrentTurn() === Turn.FINAL)) {
      const users = await service.getUsers(channelId);
      let streaks: Awaited<ReturnType<typeof service.getStreaks>> = [];
      if (games.length === users.length) {
        await DB.enableLeaderboardForRound(game.roundId);
        streaks = await service.getStreaks(channelId);
      }

      const blocks = roundEndView(
        games.map((g) => {
          const { name, image } = users.find(({ id }) => id === g.userId)!;
          return {
            name,
            image,
            ...g.getSummary(),
          };
        }),
        streaks
      );
      console.log(blocks);
      await app.client.chat.postMessage({
        channel: channelId,
        blocks,
      });
    }
  };
