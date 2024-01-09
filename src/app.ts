import dotenv from "dotenv";
dotenv.config();
import {
  App,
  ButtonAction,
  Middleware,
  RespondFn,
  SlackCommandMiddlewareArgs,
} from "@slack/bolt";
import { startView } from "./view/start";
import { cactpotView } from "./view/game";
import { roundEndView } from "./view/roundEnd";
import { leaderboardView } from "./view/leaderboard";
import { Board } from "./board";
import { Cactpot } from "./cactpot";
import { Turn } from "./constants";
import * as DB from "./mongo/game";
import { User } from "./view/lib";
import { hasAnOpaquePath } from "whatwg-url";

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

async function beginRound(
  app: App,
  respond: RespondFn,
  channelId: string,
  games: Cactpot[]
) {
  return Promise.all([
    ...games.map((game) =>
      app.client.chat.postEphemeral({
        blocks: cactpotView(game.getSummary()),
        user: game.userId,
        channel: channelId,
      })
    ),
    respond({ delete_original: true }),
  ]);
}

const cactpotStart: (app: App) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
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
    const user = await app.client.users.profile.get({ user: command.user_id });
    if (!game || !user.profile?.display_name || !user.profile?.image_24) {
      return await respond({
        response_type: "ephemeral",
        text: "Error creating game :dingus:",
        replace_original: false,
      });
    }
    await respond({
      response_type: "in_channel",
      blocks: startView(game, [user as User]),
    });
  };

const cactpotLeaderboard: (
  app: App
) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const channelId = command.channel_id;
    const humanMembers = await getHumanMembers(app, channelId);
    if (!humanMembers?.length) throw new Error();

    const games = await DB.getLeaderboard();
    const roundMap: Record<string, { userId: string; score: number }[]> = {};
    const winMap: Record<string, number> = {};
    games.forEach((game) => {
      if (!(game.roundId in roundMap)) roundMap[game.roundId] = [];
      roundMap[game.roundId].push({
        score: game.leaderboardInfo()!.score,
        userId: game.userId,
      });
    });
    Object.values(roundMap).forEach((round) => {
      const max = Math.max(...round.map(({ score }) => score));
      round.forEach(({ userId, score }) => {
        if (score === max) {
          if (!(userId in winMap)) winMap[userId] = 0;
          winMap[userId]++;
        }
      });
    });

    return await respond({
      response_type: "in_channel",
      blocks: leaderboardView(
        humanMembers
          .map(({ id, profile }) => {
            const { display_name, image_24 } = profile!;
            const userGames = games.filter(({ userId }) => userId === id);
            const leaderboardAggs = userGames
              .map((game) => game.leaderboardInfo()!)
              .reduce(
                (
                  { numGames, totalScore, cactpots, cactpotsMissed },
                  { score, cactpotPossible }
                ) => {
                  return {
                    numGames: numGames + 1,
                    totalScore: score + totalScore,
                    cactpots: cactpots + Number(score === Board.cactpot),
                    cactpotsMissed:
                      cactpotsMissed +
                      Number(cactpotPossible && score != Board.cactpot),
                  };
                },
                {
                  numGames: 0,
                  totalScore: 0,
                  cactpots: 0,
                  cactpotsMissed: 0,
                }
              );

            return {
              wins: winMap[id!],
              name: display_name!,
              image: image_24!,
              ...leaderboardAggs,
            };
          })
          .sort(({ wins: winsA }, { wins: winsB }) => winsB - winsA)
      ),
    });
  };

const main = (app: App) => {
  app.command("/cactpot", async (args) => {
    await args.ack();
    switch (args.command.text) {
      case "leaderboard":
        return await cactpotLeaderboard(app)(args);
      default:
        return await cactpotStart(app)(args);
    }
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
    console.log(games.length, humanMembers.length);
    if (games.length >= humanMembers.length) {
      await beginRound(app, respond, channelId, games);
    } else {
      await respond({
        blocks: startView(
          game,
          games.map(
            ({ userId }) => humanMembers.find(({ id }) => id === userId) as User
          )
        ),
        replace_original: true,
      });
    }
  });

  app.action("start-early", async ({ body, action, respond, ack }) => {
    await ack();
    const channelId = body?.channel?.id as string;
    const { roundId } = JSON.parse((action as ButtonAction).value);
    const games = await DB.getRound(roundId);
    if (!games?.length) throw new Error();
    await beginRound(app, respond, channelId, games);
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
