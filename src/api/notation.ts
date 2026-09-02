import {
  App,
  Middleware,
  SlackActionMiddlewareArgs,
  BlockStaticSelectAction,
} from "@slack/bolt";
import * as DB from "../mongo";
import { notationView } from "../view/notation";
import { SlackService } from "../slackService";

export const sendNotationMessage: (
  app: App
) => Middleware<SlackActionMiddlewareArgs<BlockStaticSelectAction>> =
  (app: App) =>
  async ({ action, body, respond }) => {
    const channelId = body?.channel?.id!;
    const { gameId, userId } = JSON.parse(action.selected_option.value);
    const game = await DB.getGameById(gameId);
    if (!game) throw new Error();
    const user = (await new SlackService(app).getUsers(channelId)).find(
      ({ id }) => id === userId
    );
    if (!user) throw new Error();
    const { name, image } = user;

    await respond({
      text: "",
      blocks: notationView({ ...game.getSummary(), name, image }),
      replace_original: false,
    });
  };
