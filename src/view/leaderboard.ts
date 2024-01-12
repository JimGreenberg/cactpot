import { getScoreBlock } from "./lib";

interface LeaderboardInfo {
  name: string;
  image: string;
  numGames: number;
  totalScore: number;
  cactpots: number;
  cactpotsMissed: number;
  wins: number;
  bestsAchieved: number;
}

export function leaderboardView(users: LeaderboardInfo[]) {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Leaderboard",
      },
    },
    {
      type: "section",
      text: {
        type: "plain_text",
        text: `${users[0].numGames} rounds played`,
      },
    },
    { type: "divider" },
  ];
  users.forEach((user) => blocks.push(...leaderboardUserView(user)));
  return blocks;
}

function leaderboardUserView({
  name,
  image,
  cactpots,
  cactpotsMissed,
  wins,
  bestsAchieved,
  numGames,
}: LeaderboardInfo) {
  const blocks: any[] = [
    {
      type: "context",
      elements: [
        {
          type: "image",
          image_url: image,
          alt_text: name,
        },
        {
          type: "plain_text",
          text: name,
        },
      ],
    },
    {
      type: "context",
      elements: [
        getScoreBlock(["Wins", wins]),
        {
          type: "mrkdwn",
          text: `Best Score Rate: *${Math.floor(
            (100 * bestsAchieved) / numGames
          )}%*`,
        },
        getScoreBlock(["Cactpots", cactpots]),
        getScoreBlock(["Cactpots Missed", cactpotsMissed]),
      ],
    },
  ];

  blocks.push({ type: "divider" });

  return blocks;
}
