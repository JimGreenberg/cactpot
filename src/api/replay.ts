import {
  App,
  Middleware,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
  ButtonAction,
  StaticSelectAction,
} from "@slack/bolt";
import * as DB from "../mongo";
import { Cactpot } from "../cactpot";
import { Board } from "../board";
import { replayView, beginReplayButton } from "../view/replay";

async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export const sendReplayMessage: (
  app: App
) => Middleware<SlackActionMiddlewareArgs> =
  (app: App) =>
  async ({ action, respond }) => {
    const { gameId, name, image } = JSON.parse(
      (action as StaticSelectAction).selected_option.value
    );
    await respond({
      text: "",
      blocks: beginReplayButton({ name, image, gameId }),
      replace_original: false,
    });
  };

export const beginReplay: (app: App) => Middleware<SlackActionMiddlewareArgs> =
  (app: App) =>
  async ({ action, body, respond }) => {
    const { gameId, name, image } = JSON.parse((action as ButtonAction).value);
    const game = await DB.getGameById(gameId);
    if (!game) throw new Error();

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
