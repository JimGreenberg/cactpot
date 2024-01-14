import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo/game";
import { Cactpot } from "../cactpot";
import { startView } from "../view/start";
import type { User } from "../view/lib";

export const newRound: (app: App) => Middleware<SlackCommandMiddlewareArgs> =
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
