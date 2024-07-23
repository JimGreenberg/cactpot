import { App, RespondFn } from "@slack/bolt";
import * as DB from "./mongo";
import { Cactpot } from "./cactpot";
import { cactpotFullWidth } from "./view/cactpotFullWidth";
import type { Avatar, LeaderboardInfo } from "./types";

interface User {
  id: string;
  name: string;
  image: string;
}

export class SlackService {
  private users: User[];

  constructor(private app: App) {}

  async getUsers(channelId: string) {
    if (this.users) return this.users;
    const { members } = await this.app.client.conversations.members({
      channel: channelId,
    });
    if (!members?.length) throw new Error();

    const { members: users } = await this.app.client.users.list();
    if (!users?.length) throw new Error();

    this.users = users
      .filter(({ is_bot }) => !is_bot)
      .filter(({ id }) => members.includes(id as string))
      .map((user) => ({
        id: user.id!,
        name: user.profile?.display_name!,
        image: user.profile?.image_24!,
      }));

    return this.users;
  }

  async beginRound(respond: RespondFn, channelId: string, games: Cactpot[]) {
    return Promise.all([
      ...games.map((game) => {
        this.app.client.chat.postEphemeral({
          text: "<!channel> Cactpot has begun!",
          blocks: cactpotFullWidth(game.getSummary()),
          user: game.userId,
          channel: channelId,
        });
      }),
      respond({ delete_original: true }),
    ]);
  }

  async getLeaderboard(
    channelId: string,
    limit?: number
  ): Promise<(LeaderboardInfo & Avatar)[]> {
    const users = await this.getUsers(channelId);
    if (!users?.length) throw new Error();

    const leaderboard = await DB.getLeaderboard(channelId, limit);
    return leaderboard.map(({ userId, ...rest }) => {
      const user = users.find(({ id }) => id === userId)!;
      return { ...rest, userId, name: user.name, image: user.image };
    });
  }

  // this is hot garbage
  async getStreaks(channelId: string, limit: number = 3) {
    const MAX_LIMIT = 10;
    if (limit > MAX_LIMIT) {
      throw new Error("max limit");
    }
    const leaderboard = await this.getLeaderboard(channelId, limit);
    const fields = [
      "soloWins",
      "soloLosses",
      "firstPlaceMedals",
    ] satisfies (keyof LeaderboardInfo)[];
    const fieldNames: Record<(typeof fields)[number], string> = {
      soloWins: "solo dub",
      soloLosses: ":spicy_keychain:",
      firstPlaceMedals: "win",
    };
    const streaks: ({
      userId: string;
      field: (typeof fields)[number];
      fieldName: string;
      count: number;
    } & Avatar)[] = [];
    fields.forEach((field) => {
      leaderboard.forEach(({ userId, name, image, ...rest }) => {
        if (rest[field] >= limit) {
          streaks.push({
            userId,
            field,
            fieldName: fieldNames[field],
            count: rest[field],
            name,
            image,
          });
        }
      });
    });

    let more: typeof streaks = [];
    if (streaks.length) {
      try {
        more = await this.getStreaks(channelId, limit + 1);
      } catch {
        const i = streaks.findIndex(({ count }) => count >= MAX_LIMIT);
        if (streaks[i]) {
          streaks[i].count = "10+" as any;
        }
      }
    }
    // more always has a better streak since the query limit will be higher
    // a streak is only a streak if the number is === to the query limit
    more.forEach((betterStreak) => {
      const i = streaks.findIndex(
        (streak) =>
          streak.field === betterStreak.field &&
          streak.userId === betterStreak.userId
      );
      if (streaks[i]) {
        streaks.splice(i, 1, betterStreak);
      }
    });

    return streaks;
  }
}
