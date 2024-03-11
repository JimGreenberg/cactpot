import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo";
import { leaderboardView } from "../view/leaderboard";
import { SlackService } from "../slackService";
import { checkHonestyView } from "../view/checkHonesty";

export const checkHonesty: (
  app: App
) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const channelId = command.channel_id;
    const service = new SlackService(app);
    const users = await service.getUsers(channelId);
    if (!users?.length) throw new Error();

    const optiPctArray = await DB.findCheaters(channelId);
    const optiPctWithUserInfo = optiPctArray.map(({ userId, ...rest }) => {
      const user = users.find(({ id }) => id === userId)!;
      return { ...rest, name: user.name, image: user.image };
    });

    if (!optiPctWithUserInfo.length) {
      return await respond({
        response_type: "ephemeral",
        text: "Error finding games :dingus:",
      });
    }

    return await respond({
      response_type: "in_channel",
      blocks: checkHonestyView(optiPctWithUserInfo),
    });
  };
