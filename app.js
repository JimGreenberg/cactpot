import dotenv from "dotenv";
dotenv.config();
import Bolt from "@slack/bolt";
import { cactpotView } from "./view";
import { Cactpot } from "./cactpot";

const BOT_TEST = "C03LZF604RG";

const main = (app) => {
  app.command("/cactpot", async ({ command, ack, respond }) => {
    // Acknowledge command request
    await ack();

    const cactpot = new Cactpot();

    await respond(cactpotView(cactpot.getSummary()));
  });
};

const newApp = () =>
  new Bolt.App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
  });

const runtime = () => {
  const _app = newApp();
  _app.start();
  main(_app);
  _app.error(() => {
    runtime();
  });
};

runtime();
