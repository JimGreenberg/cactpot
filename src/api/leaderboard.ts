import { App, Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as DB from "../mongo";
import { Board } from "../board";
import { leaderboardView } from "../view/leaderboard";
import { SlackService } from "../slackService";

export const leaderboard: (
  app: App
) => Middleware<SlackCommandMiddlewareArgs> =
  (app: App) =>
  async ({ command, respond }) => {
    const channelId = command.channel_id;
    const service = new SlackService(app);
    const users = await service.getUsers(channelId);
    if (!users?.length) throw new Error();

    const userGames = (await DB.getLeaderboard()).map(
      <T extends { userId: string }>({
        userId,
        ...rest
      }: T): Omit<T, "userId"> & { name: string; image: string } => {
        const user = users.find(({ id }) => id === userId);
        return {
          ...rest,
          name: user?.profile?.display_name || "",
          image: user?.profile?.image_24 || "",
        };
      }
    );

    return await respond({
      response_type: "in_channel",
      blocks: leaderboardView(userGames),
    });
  };
