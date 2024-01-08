import dotenv from "dotenv";
dotenv.config();
import { App, BlockElementAction, ButtonAction } from "@slack/bolt";
import { cactpotView } from "./view";
import { Cactpot } from "./cactpot";
import { Board } from "./board";
import { TilePosition, BoardLine } from "./constants";

const BOT_TEST = "C03LZF604RG";

const main = (app: App) => {
  app.command("/cactpot", async ({ command, ack, respond }) => {
    // Acknowledge command request
    await ack();

    const game = new Cactpot();
    // const moves = [
    //   TilePosition.TOP_LEFT,
    //   TilePosition.BOTTOM_LEFT,
    //   TilePosition.TOP_RIGHT,
    //   BoardLine.ANTIDIAGONAL,
    // ];
    // for (const move of moves) {
    //   const { board, score, bestScore } = game.takeTurn(move);
    // }

    await respond({ blocks: cactpotView(game.getSummary()) });
  });

  app.action(/button/, async ({ action, respond, ack }) => {
    await ack();
    const { value, seedString } = JSON.parse((action as ButtonAction).value);
    const game = new Cactpot(new Board(seedString, value));
    await respond({
      replace_original: true,
      blocks: cactpotView(game.getSummary()),
    });
  });
};

const newApp = () =>
  new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
  });

const runtime = () => {
  const _app = newApp();
  _app.start();
  main(_app);
  // @ts-ignore
  _app.error((...args) => {
    console.log(args);
    runtime();
  });
};

runtime();
