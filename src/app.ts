import dotenv from "dotenv";
dotenv.config();
import { App, ButtonAction } from "@slack/bolt";
import { startView } from "./view/start";
import { cactpotView } from "./view/game";
import { roundEndView } from "./view/roundEnd";
import { Cactpot } from "./cactpot";
import { Turn } from "./constants";
import * as DB from "./mongo/game";

const BOT_TEST = "C03LZF604RG";

async function getHumanMembers(app: App, channelId: string) {
  const { members } = await app.client.conversations.members({
    channel: channelId,
  });
  if (!members?.length) throw new Error();

  const { members: users } = await app.client.users.list();
  if (!users?.length) throw new Error();

  return users
    .filter(({ is_bot }) => !is_bot)
    .filter(({ id }) => members.includes(id as string));
}

async function beginRound(app: App, channelId: string, games: Cactpot[]) {
  return Promise.all(
    games.map((game) =>
      app.client.chat.postEphemeral({
        blocks: cactpotView(game.getSummary()),
        user: game.userId,
        channel: channelId,
      })
    )
  );
}

const main = (app: App) => {
  app.command("/cactpot", async ({ command, ack, respond }) => {
    await ack();
    let game: Cactpot;
    try {
      game = await DB.createGame(command.user_id);
    } catch {
      return await respond({
        response_type: "ephemeral",
        text: "Error creating game :dingus:",
        replace_original: false,
      });
    }
    if (!game)
      return await respond({
        response_type: "ephemeral",
        text: "Error creating game :dingus:",
        replace_original: false,
      });
    await respond({ response_type: "in_channel", blocks: startView(game, 1) });
  });

  app.action("join", async ({ body, action, respond, ack }) => {
    await ack();
    const channelId = body?.channel?.id as string;
    const { roundId, seedString } = JSON.parse((action as ButtonAction).value);

    let game: Cactpot;
    try {
      game = await DB.joinGame({
        userId: body.user.id,
        roundId,
        seedString,
      });
    } catch {
      return await respond({
        response_type: "ephemeral",
        text: "You've already joined this Cactpot :dingus:",
        replace_original: false,
      });
    }

    const games = await DB.getRound(roundId);
    if (!games?.length) throw new Error();
    const humanMembers = await getHumanMembers(app, channelId);

    if (games.length >= humanMembers.length) {
      await beginRound(app, channelId, games);
    } else {
      await respond({
        blocks: startView(game, games.length),
        replace_original: true,
      });
    }
  });

  app.action("start-early", async ({ body, action, ack }) => {
    await ack();
    const channelId = body?.channel?.id as string;
    const { roundId } = JSON.parse((action as ButtonAction).value);
    const games = await DB.getRound(roundId);
    if (!games?.length) throw new Error();
    await beginRound(app, channelId, games);
  });

  app.action(/button/, async ({ action, body, respond, ack }) => {
    await ack();
    const channelId = body?.channel?.id as string;
    const { value, gameId } = JSON.parse((action as ButtonAction).value);
    let game: Cactpot;
    try {
      game = await DB.takeTurn(gameId, value);
    } catch (e) {
      return;
    }
    await respond({
      replace_original: true,
      blocks: cactpotView(game.getSummary()),
    });

    const games = await DB.getRound(game.roundId);
    if (!games?.length) throw new Error();
    if (games.every((game) => game.getCurrentTurn() === Turn.FINAL)) {
      const games = await DB.getRound(game.roundId);
      const humanMembers = await getHumanMembers(app, channelId);
      if (games.length === humanMembers.length) {
        await DB.finalizeRound(game.roundId);
      }
      const blocks = roundEndView(
        // @ts-ignore
        games.map((g) => ({
          ...humanMembers.find(({ id }) => id === g.userId),
          ...g.getSummary(),
        }))
      );
      await app.client.chat.postMessage({
        channel: channelId,
        blocks,
      });
    }
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
