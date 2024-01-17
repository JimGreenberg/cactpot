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
import * as Errors from "../error";

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
      if (e instanceof Errors.InvalidMove) {
        const user = await app.client.users.profile.get({
          user: body?.user?.id,
        });
        await respond({
          response_type: "in_channel",
          text: `:dingus: ${
            user?.profile?.display_name || "Someone"
          } tried to select an already revealed tile`,
          replace_original: false,
        });
      }
      return;
    }

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
        // @ts-ignore
        games.map((g) => ({
          ...users.find(({ id }) => id === g.userId),
          ...g.getSummary(),
        }))
      );
      await app.client.chat.postMessage({
        channel: channelId,
        blocks,
      });
    }
  };