import { App, RespondFn } from "@slack/bolt";
import { Cactpot } from "./cactpot";
import { cactpotView } from "./view/game";

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

  async beginRound(respond: RespondFn, channelId: string, games: Cactpot[]) {
    return Promise.all([
      ...games.map((game) =>
        this.app.client.chat.postEphemeral({
          blocks: cactpotView(game.getSummary()),
          user: game.userId,
          channel: channelId,
        })
      ),
      respond({ delete_original: true }),
    ]);
  }
}
