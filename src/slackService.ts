import { App } from "@slack/bolt";
import { Cactpot } from "./cactpot";
import { cactpotView } from "./view/game";
import { inProgressRound } from "./view/inProgressRound";

export class SlackService {
  constructor(private app: App) {}

  async getUsers(channelId: string) {
    const { members } = await this.app.client.conversations.members({
      channel: channelId,
    });
    if (!members?.length) throw new Error();

    const { members: users } = await this.app.client.users.list();
    if (!users?.length) throw new Error();

    return users
      .filter(({ is_bot }) => !is_bot)
      .filter(({ id }) => members.includes(id as string));
  }

  async beginRound(channelId: string, games: Cactpot[], users: any[]) {
    const { message } = await this.app.client.chat.postMessage({
      text: "",
      channel: channelId,
      blocks: inProgressRound(
        games.map((g) => {
          const user = users.find(({ id }) => id === g.userId);
          return {
            turn: g.getCurrentTurn(),
            name: user?.profile?.display_name!,
            image: user?.profile?.image_24!,
          };
        })
      ),
    });
    return Promise.all([
      ...games.map((game) =>
        this.app.client.chat.postEphemeral({
          text: "",
          blocks: cactpotView(game.getSummary(), message?.ts!),
          user: game.userId,
          channel: channelId,
        })
      ),
    ]);
  }
}
