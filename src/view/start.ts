import { Cactpot } from "../cactpot";

export function startView(cactpot: Cactpot, currentPlayers: number) {
  const value = JSON.stringify({
    gameId: cactpot.gameId,
    roundId: cactpot.roundId,
    seedString: cactpot.seedString,
  });

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Would you like to play cactpot?",
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          value,
          action_id: "join",
          text: {
            type: "plain_text",
            text: "Join",
          },
        },
        {
          type: "button",
          value,
          action_id: "start-early",
          style: "danger",
          text: {
            type: "plain_text",
            text: "Start early",
          },
          confirm: {
            title: { text: "Start early?", type: "plain_text" },
            text: {
              text: `Play with only ${currentPlayers} players? This will not affect the leaderboards`,
              type: "plain_text",
            },
            confirm: { text: "Play Anyway", type: "plain_text" },
            deny: { text: "Cancel", type: "plain_text" },
          },
        },
      ],
    },
    {
      type: "context",
      elements: [{ type: "plain_text", text: `${currentPlayers} joined` }],
    },
  ];
}
