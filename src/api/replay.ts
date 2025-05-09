import {
  App,
  Middleware,
  SlackActionMiddlewareArgs,
  BlockStaticSelectAction,
  BlockButtonAction,
} from "@slack/bolt";
import * as DB from "../mongo";
import { Cactpot } from "../cactpot";
import { Board } from "../board";
import { replayView, beginReplayButton } from "../view/replay";
import { SlackService } from "../slackService";

async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export const sendReplayMessage: (
  app: App
) => Middleware<SlackActionMiddlewareArgs<BlockStaticSelectAction>> =
  (app: App) =>
  async ({ action, body, respond }) => {
    const channelId = body?.channel?.id!;
    const { gameId, userId } = JSON.parse(action.selected_option.value);
    const user = (await new SlackService(app).getUsers(channelId)).find(
      ({ id }) => id === userId
    );
    if (!user) throw new Error();
    const { name, image } = user;

    await respond({
      text: "",
      blocks: beginReplayButton({ name, image, gameId, userId }),
      replace_original: false,
    });
  };

export const beginReplay: (
  app: App
) => Middleware<SlackActionMiddlewareArgs<BlockButtonAction>> =
  (app: App) =>
  async ({ action, body, respond }) => {
    const channelId = body?.channel?.id!;
    const { gameId, userId } = JSON.parse(action.value);
    const game = await DB.getGameById(gameId);
    if (!game) throw new Error();
    const user = (await new SlackService(app).getUsers(channelId)).find(
      ({ id }) => id === userId
    );
    if (!user) throw new Error();
    const { name, image } = user;

    const freshGame = new Cactpot(
      new Board(game.seedString, game.initialReveal),
      gameId
    );
    const summary = game.getSummary();
    const turns = [...summary.reveals, summary.lineChoice!];

    await respond({
      text: "",
      blocks: replayView({ ...freshGame.getSummary(), name, image }),
      replace_original: true,
    });
    await delay(700);

    for (const turn of turns) {
      await respond({
        text: "",
        blocks: replayView({ ...freshGame.takeTurn(turn), name, image }),
        replace_original: true,
      });
      await delay(700);
    }
  };
