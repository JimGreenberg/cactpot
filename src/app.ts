import dotenv from "dotenv";
dotenv.config();
import { App } from "@slack/bolt";
import * as API from "./api";

const BOT_TEST = "C03LZF604RG";

const main = (app: App) => {
  app.command("/cactpot", async (args) => {
    await args.ack();
    switch (args.command.text) {
      case "leaderboard":
        return await API.leaderboard(app)(args);
      case "unfinished":
        return await API.unfinished(app)(args);
      case "":
      case "start":
        return await API.newRound(app)(args);
    }
  });

  app.action("join", async (args) => {
    await args.ack();
    await API.joinGame(app)(args);
  });

  app.action("start-early", async (args) => {
    await args.ack();
    await API.startEarly(app)(args);
  });

  app.action(/button/, async (args) => {
    await args.ack();
    await API.takeTurn(app)(args);
  });

  // action on results page to send ephemeral message with begin replay button
  app.action("send-replay-message", async (args) => {
    await args.ack();
    await API.sendReplayMessage(app)(args);
  });

  // button on the replay message to kick off the animation
  app.action("begin-replay", async (args) => {
    await args.ack();
    await API.beginReplay(app)(args);
  });

  app.action("delete", async ({ ack, respond }) => {
    await ack();
    await respond({ delete_original: true });
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
