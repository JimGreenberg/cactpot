import { App } from "@slack/bolt";

export class SlackService {
  constructor(private app: App) {}

  async getHumanMembers(channelId: string) {
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
}
