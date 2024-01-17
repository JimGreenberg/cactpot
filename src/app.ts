import dotenv from "dotenv";
dotenv.config();
import { App } from "@slack/bolt";
import { newRound } from "./api/newRound";
import { leaderboard } from "./api/leaderboard";
import { takeTurn } from "./api/turn";
import { joinGame } from "./api/join";
import { startEarly } from "./api/startEarly";

const BOT_TEST = "C03LZF604RG";

const main = (app: App) => {
  app.command("/cactpot", async (args) => {
    await args.ack();
    switch (args.command.text) {
      case "leaderboard":
        return await leaderboard(app)(args);
      default:
        return await newRound(app)(args);
    }
  });

  app.action("join", async (args) => {
    await args.ack();
    await joinGame(app)(args);
  });

  app.action("start-early", async (args) => {
    await args.ack();
    await startEarly(app)(args);
  });

  app.action(/button/, async (args) => {
    await args.ack();
    await takeTurn(app)(args);
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
    console.error(args);
    runtime();
  });
};

runtime();
