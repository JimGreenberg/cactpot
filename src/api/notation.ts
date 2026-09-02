import {
  App,
  Middleware,
  SlackActionMiddlewareArgs,
  BlockStaticSelectAction,
} from "@slack/bolt";
import * as DB from "../mongo";
import * as Errors from "../error";
import { notationView } from "../view/notation";
import { SlackService } from "../slackService";

export const sendNotationMessage: (
  app: App
) => Middleware<SlackActionMiddlewareArgs<BlockStaticSelectAction>> =
  (app: App) =>
  async ({ action, body, respond }) => {
    // the round end message is shared and long lived, so a bad game or a
    // departed user should cost the clicker one ephemeral message, not fail
    // silently the way an uncaught throw does
    try {
      const channelId = body?.channel?.id!;
      const { gameId, userId } = JSON.parse(action.selected_option.value);
      const game = await DB.getGameById(gameId);
      if (!game) throw new Errors.NotFound("game");
      const user = (await new SlackService(app).getUsers(channelId)).find(
        ({ id }) => id === userId
      );
      if (!user) throw new Errors.NotFound("user");
      const { name, image } = user;

      await respond({
        text: "",
        blocks: notationView({ ...game.getSummary(), name, image }),
        replace_original: false,
      });
    } catch (e) {
      console.error(e);
      await respond({
        text: "Couldn't build the notation for that game",
        replace_original: false,
      });
    }
  };
