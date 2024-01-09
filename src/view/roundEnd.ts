import { Summary } from "../cactpot";
import { Board } from "../board";
import { BoardLine, TilePosition } from "../constants";
import { renderTile, wrap, getScoreBlock } from "./lib";

interface SummaryWithUser extends Summary {
  profile: {
    image_24: string;
    display_name: string;
  };
}

export function roundEndView(games: SummaryWithUser[]) {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Results",
      },
    },
  ];
  games.forEach((game) => blocks.push(...renderGame(game)));

  blocks.push({
    type: "section",
    text: getScoreBlock([
      "The best score on this board was",
      games[0].bestScore,
    ]),
  });
  blocks.push({
    type: "context",
    elements: [
      {
        type: "plain_text",
        text: `Round ID: ${games[0].roundId}`,
      },
    ],
  });
  return blocks;
}

function renderGame({
  board,
  score,
  lineChoice,
  gameId,
  profile: { display_name, image_24 },
}: SummaryWithUser) {
  const blocks: any[] = [
    {
      type: "context",
      elements: [
        {
          type: "image",
          image_url: image_24,
          alt_text: display_name,
        },
        {
          type: "plain_text",
          text: display_name,
        },
      ],
    },
  ];
  let tilePosition = 0;
  board.forEach((row) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: row
          .map((tile) => {
            const value = Object.values(TilePosition)[tilePosition++];
            const selectedTile =
              lineChoice &&
              Board.positionsFromBoardLine(lineChoice).includes(value);
            const char = renderTile(tile, selectedTile);
            return selectedTile ? char : wrap(wrap(char, " "), "`");
          })
          .join(" "),
      },
    });
  });

  blocks.push({
    type: "section",
    text: getScoreBlock(["Score", score]),
  });

  blocks.push({
    type: "context",
    elements: [
      {
        type: "plain_text",
        text: `Game ID: ${gameId}`,
      },
    ],
  });

  blocks.push({ type: "divider" });

  return blocks;
}
