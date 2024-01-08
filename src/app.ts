import dotenv from "dotenv";
dotenv.config();
import { App, BlockElementAction, Button, ButtonAction } from "@slack/bolt";
import { startView } from "./view/start";
import { cactpotView } from "./view/game";
import { Cactpot } from "./cactpot";
import { Board } from "./board";
import { TilePosition, BoardLine } from "./constants";
import * as DB from "./mongo/game";

const BOT_TEST = "C03LZF604RG";

const main = (app: App) => {
  app.command("/cactpot", async ({ command, ack, respond }) => {
    await ack();
    const game = await DB.createGame(command.user_id);
    await respond({ response_type: "in_channel", blocks: startView(game, 1) });
  });

  app.action("join", async ({ body, action, respond, ack }) => {
    await ack();
    const { roundId, seedString } = JSON.parse((action as ButtonAction).value);
    const game = await DB.joinGame({
      userId: body.user.id,
      // userId: "Foo",
      roundId,
      seedString,
    });
    const games = await DB.getRound(roundId);
    await respond({
      blocks: startView(game, games.length),
      replace_original: true,
    });
  });

  app.action("start-early", async ({ action, respond, ack }) => {
    await ack();
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
