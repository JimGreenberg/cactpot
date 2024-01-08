import { Summary } from "./cactpot";
import { Board, Tile } from "./board";
import { Turn } from "./constants";

export function cactpotView({ board, score, bestScore, turn }: Summary) {
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

  // blocks.push(...renderBoardBlocks(board));

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

  blocks.push(...getScoreInfoBlocks());

  return { blocks };
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

function renderTile(value: number | typeof Tile.HIDDEN): string {
  switch (value) {
    case Tile.HIDDEN:
      return ":black_circle_for_record:";
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
  }
  throw new Error(); // unreachable
}

function button(text: string) {
  return {
    type: "button",
    text: {
      type: "plain_text",
      emoji: true,
      text,
    },
    value: "click_me_123",
  };
}

function getBoardBlocks(board: Summary["board"]) {
  const blocks = new Array(4).fill({ type: "actions", elements: [] });
  // first row is always the same
  blocks[0].elements = [
    ":arrow_lower_right:",
    ":arrow_down:",
    ":arrow_down:",
    ":arrow_down:",
    ":arrow_lower_left:",
  ].map(button);
  board.forEach((row, i) => {
    blocks[i + 1] = [
      button(":arrow_right:"),
      ...row.map(renderTile).map(button),
    ];
  });
  return blocks;
}

function getScoreInfoBlocks() {
  function getBlankContext(elements: any[] = []) {
    return {
      type: "context",
      elements,
    };
  }

  const blocks = [
    getBlankContext([
      {
        type: "plain_text",
        text: "Scores",
      },
    ]),
    getBlankContext(),
  ];
  const scoreBlocks = Object.entries(Board.scores).map(getScoreInfoBlock);
  while (scoreBlocks.length) {
    const nextElements = blocks[blocks.length - 1].elements;
    if (nextElements.length < 5) {
      nextElements.push(scoreBlocks.shift());
    } else {
      blocks.push(getBlankContext([scoreBlocks.shift()]));
    }
  }
  return blocks;
}

function getScoreInfoBlock([label, score]: [string, number]) {
  return {
    type: "mrkdwn",
    text: `*${label}* | ${score.toLocaleString()}`,
  };
}

function getScoreBlock([label, score]: [string, number]) {
  return {
    type: "mrkdwn",
    text: `${label}: *${score.toLocaleString()}*`,
  };
}
