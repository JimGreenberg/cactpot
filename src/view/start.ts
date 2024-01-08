export function startView(roundId: string, currentPlayers: number) {
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
          value: roundId,
          action_id: "join",
          text: {
            type: "plain_text",
            text: "Join",
          },
        },
        {
          type: "button",
          value: roundId,
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
