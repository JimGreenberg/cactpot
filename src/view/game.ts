import { Summary } from "./cactpot";
import { Board, Tile } from "./board";
import { Turn, TilePosition, BoardLine } from "./constants";

export function cactpotView(summary: Summary) {
  const { score, bestScore, turn } = summary;
  const blocks: any[] = [];

  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: getHeaderCopy(turn),
    },
  });

  const errorMessage = getErrorMessage();
  if (errorMessage) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:x: ${errorMessage}`,
        },
      ],
    });
  }

  blocks.push(...getBoardBlocks(summary));

  if (score) {
    blocks.push({
      type: "section",
      text: getScoreBlock(["You scored", score]),
    });
  }

  if (bestScore) {
    blocks.push({
      type: "section",
      text: getScoreBlock(["The best score on this board is", bestScore]),
    });
  }

  blocks.push(...getScoreInfoBlocks(score));

  return blocks;
}

export function getHeaderCopy(turn: Turn) {
  switch (turn) {
    case Turn.INIT:
      return "Select three slots to uncover";
    case Turn.FIRST:
      return "Select two slots to uncover";
    case Turn.SECOND:
      return "Select one slot to uncover";
    case Turn.THIRD:
      return "Select a line to add up";
    case Turn.FINAL:
      return "Score";
  }
}

export function getErrorMessage() {
  return "";
}

function renderTile(
  value: number | typeof Tile.HIDDEN,
  selectedTile = false
): string {
  if (value === Tile.HIDDEN) return " ";
  if (!selectedTile) return String(value);
  switch (value) {
    case 1:
      return ":one:";
    case 2:
      return ":two:";
    case 3:
      return ":three:";
    case 4:
      return ":four:";
    case 5:
      return ":five:";
    case 6:
      return ":six:";
    case 7:
      return ":seven:";
    case 8:
      return ":eight:";
    case 9:
      return ":nine:";
    default:
      throw new Error(); // unreachable
  }
}

function button({ text, value }: { text: string; value: string }) {
  return {
    type: "button",
    value,
    action_id: `button-${value}`,
    text: {
      type: "plain_text",
      emoji: true,
      text,
    },
  };
}

function getBoardBlocks({ board, lineChoice, seedString }: Summary) {
  function getBlankActions(elements: any[] = []) {
    return { type: "actions", elements };
  }
  function getJsonStringValue(value: string) {
    return JSON.stringify({ value, seedString });
  }
  // first row is always the same
  const blocks = [
    getBlankActions(
      [
        {
          text: ":arrow_lower_right:",
          value: getJsonStringValue(BoardLine.ANTIDIAGONAL),
        },
        { text: ":arrow_down:", value: getJsonStringValue(BoardLine.LEFT_COL) },
        {
          text: ":arrow_down:",
          value: getJsonStringValue(BoardLine.MIDDLE_COL),
        },
        {
          text: ":arrow_down:",
          value: getJsonStringValue(BoardLine.RIGHT_COL),
        },
        {
          text: ":arrow_lower_left:",
          value: getJsonStringValue(BoardLine.DIAGONAL),
        },
      ].map(button)
    ),
  ];

  let tilePosition = TilePosition.TOP_LEFT;
  const rowLines = [
    BoardLine.TOP_ROW,
    BoardLine.MIDDLE_ROW,
    BoardLine.BOTTOM_ROW,
  ];
  board.forEach((row, i) => {
    blocks.push(
      getBlankActions([
        button({ text: ":arrow_right:", value: rowLines[i] }),
        ...row.map((tile) => {
          const value = tilePosition++;
          const selectedTile =
            lineChoice &&
            Board.positionsFromBoardLine(lineChoice).includes(value);
          return button({
            text: renderTile(tile, selectedTile),
            value: getJsonStringValue(String(value)),
          });
        }),
      ])
    );
  });

  return blocks;
}

function getScoreInfoBlocks(score: number, rows = 4) {
  function getBlankContext(elements: any[] = []) {
    return {
      type: "context",
      elements,
    };
  }

  const blocks = new Array(rows).fill(0).map(() => getBlankContext());
  const scoreBlocks = Object.entries(Board.scores).map(([sum, points]) =>
    getScoreInfoBlock([sum, points], score === points)
  );
  while (scoreBlocks.length) {
    for (let i = 0; i < rows; i++) {
      const scoreBlock = scoreBlocks.shift();
      scoreBlock && blocks[i].elements.push(scoreBlock);
    }
  }
  return [
    getBlankContext([
      {
        type: "plain_text",
        text: "Scores",
      },
    ]),
    ...blocks,
  ];
}

function getScoreInfoBlock([label, score]: [string, number], selected = false) {
  const totalLength = 8;
  const scoreFmt = score.toLocaleString();
  const spacerLength = totalLength - scoreFmt.length - label.length;
  function wrap(str: string, bookend: string): string {
    return `${bookend}${str}${bookend}`;
  }

  const text =
    wrap(wrap(label, "`"), "*") +
    wrap(" ".repeat(spacerLength) + score.toLocaleString(), "`");
  return {
    type: "mrkdwn",
    // text: `*${label}* | ${score.toLocaleString()}`,
    text,
  };
}

function getScoreBlock([label, score]: [string, number]) {
  return {
    type: "mrkdwn",
    text: `${label}: *${score.toLocaleString()}*`,
  };
}
