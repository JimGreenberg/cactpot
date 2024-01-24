import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo";
import { startView } from "../view/start";

export const newRound: (app: App) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond, say }) => {
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
    const slackUser = await app.client.users.profile.get({ user: userId });
    const user = {
      id: userId,
      name: slackUser.profile?.display_name!,
      image: slackUser.profile?.image_24!,
    };
    if (!roundId || !user.name || !user.image) {
      return await respond({
        response_type: "ephemeral",
        text: "Error creating game :dingus:",
        replace_original: false,
      });
    }
    await say({
      blocks: startView(roundId, [user]),
      text: "<!channel> A round of Cactpot is starting!",
    });
  };
