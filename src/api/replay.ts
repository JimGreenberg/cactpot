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
import { replayView } from "../view/replay";
import { SlackService } from "../slackService";

import type { Readable } from "stream";
// @ts-ignore
import GIFEncoder from "gifencoder";
import { SIZE, makeReplayGif } from "../replay-gif/canvas";

async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export const uploadReplayGif: (
  app: App,
) => Middleware<SlackActionMiddlewareArgs<BlockStaticSelectAction>> =
  (app: App) =>
  async ({ action, body, say }) => {
    const channelId = body?.channel?.id!;
    const { gameId, userId } = JSON.parse(action.selected_option.value);
    const user = (await new SlackService(app).getUsers(channelId)).find(
      ({ id }) => id === userId,
    );
    if (!user) throw new Error();
    const { name, image } = user;

    const game = await DB.getGameById(gameId);
    if (!game) throw new Error();

    const encoder = new GIFEncoder(SIZE, SIZE);
    const rs: Readable = encoder.createReadStream();
    await makeReplayGif(encoder, game);

    const elements: any[] = [
      { type: "mrkdwn", text: `Watch ${name}'s replay!` },
    ];
    if (image) {
      elements.unshift({ type: "image", image_url: image, alt_text: name });
    }
    await say({
      text: `Watch ${name}'s replay!`,
      blocks: [{ type: "context", elements }],
    });

    await app.client.files.uploadV2({
      file_uploads: [
        { filename: `${name}-replay-${game.roundId}.gif`, file: rs },
      ],
      channel_id: channelId,
    });
    rs.destroy();
  };

export const beginReplay: (
  app: App,
) => Middleware<SlackActionMiddlewareArgs<BlockButtonAction>> =
  (app: App) =>
  async ({ action, body, respond }) => {
    const channelId = body?.channel?.id!;
    const { gameId, userId } = JSON.parse(action.value);
    const game = await DB.getGameById(gameId);
    if (!game) throw new Error();
    const user = (await new SlackService(app).getUsers(channelId)).find(
      ({ id }) => id === userId,
    );
    if (!user) throw new Error();
    const { name, image } = user;

    const freshGame = new Cactpot(
      new Board(game.seedString, game.initialReveal),
      gameId,
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
