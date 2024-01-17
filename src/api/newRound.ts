import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo";
import { startView } from "../view/start";
import type { User } from "../view/util";

export const newRound: (app: App) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const userId = command.user_id;
    let roundId: string;
    try {
      roundId = await DB.createRound(command.channel_id);
      await DB.joinGame({ roundId, userId });
    } catch (e) {
      console.error(e);
      return await respond({
        response_type: "ephemeral",
        text: "Error creating game :dingus:",
        replace_original: false,
      });
    }
    const user = await app.client.users.profile.get({ user: userId });
    if (!roundId || !user.profile?.display_name || !user.profile?.image_24) {
      return await respond({
        response_type: "ephemeral",
        text: "Error creating game :dingus:",
        replace_original: false,
      });
    }
    await respond({
      response_type: "in_channel",
      blocks: startView(roundId, [user as User]),
    });
  };
