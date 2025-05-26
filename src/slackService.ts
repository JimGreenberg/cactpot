import { App, RespondFn } from "@slack/bolt";
import * as DB from "./mongo";
import { Cactpot } from "./cactpot";
import { cactpotFullWidth } from "./view/cactpotFullWidth";
import { gameHasBegun } from "./view/gameHasBegun";
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
    // console.log(members);
    if (!members?.length) throw new Error();

    const { members: users } = await this.app.client.users.list();
    if (!users?.length) throw new Error();
    // console.log(users);

    this.users = users
      .filter(({ is_bot }) => !is_bot)
      .filter(({ id }) => members.includes(id as string))
      .map((user) => ({
        id: user.id!,
        name:
          user.profile?.display_name! ||
          user.profile?.real_name_normalized ||
          "name",
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
      respond({
        replace_original: true,
        text: "<!channel> The game has begun",
        blocks: gameHasBegun("<!channel> The game has begun"),
      }),
    ]);
  }

  async getLeaderboard(
    channelId: string,
    text: string,
    limit?: number
  ): Promise<(LeaderboardInfo & Avatar)[]> {
    function getMonthYear(
      text: string
    ): [number | undefined, number | undefined] {
      const months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];
      let month: number | undefined;
      let year: number | undefined;
      const splitted = text.split(" ");
      if (splitted.length === 2) {
        const [maybeMonth, maybeYear] = splitted;
        month = months.findIndex((_month) =>
          new RegExp(`^${maybeMonth.toLowerCase()}`).test(_month)
        );
        if (month === -1) {
          month = undefined;
        }
        year = /\d{4}/.test(maybeYear) ? parseInt(maybeYear) : undefined;
      }
      return [month, year];
    }
    const users = await this.getUsers(channelId);
    if (!users?.length) throw new Error();
    let options: DB.GetLeaderboardOptions = { limit };
    if (text === "all") {
      options = {
        all: true,
        limit,
      };
    } else if (!text || text === " ") {
      options = {
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        limit,
      };
    } else if (/\d{4}/.test(text)) {
      options = {
        year: parseInt(text),
        limit,
      };
    } else {
      const [month, year] = getMonthYear(text);
      console.log(month, year);
      if (typeof month === "number" && typeof year === "number") {
        options = {
          month,
          year,
          limit,
        };
      }
    }
    const leaderboard = await DB.getLeaderboard(channelId, options);
    return leaderboard.map(({ userId, ...rest }) => {
      const user = users.find(({ id }) => id === userId)!;
      return { ...rest, userId, name: user.name, image: user.image };
    });
  }

  // this is hot garbage
  async getStreaks(channelId: string, year?: number, limit: number = 3) {
    const MAX_LIMIT = 10;
    if (limit > MAX_LIMIT) {
      throw new Error("max limit");
    }
    const leaderboard = await this.getLeaderboard(
      channelId,
      `${new Date().getFullYear()}`,
      limit
    );
    const fields = [
      "soloWins",
      "soloLosses",
      "wins",
      "losses",
    ] satisfies (keyof LeaderboardInfo)[];
    const fieldNames: Record<(typeof fields)[number], string> = {
      soloWins: "solo dub",
      soloLosses: ":spicy_keychain:",
      wins: "win",
      losses: "losing",
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
        more = await this.getStreaks(channelId, year, limit + 1);
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
