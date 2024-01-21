import { Summary } from "../cactpot";
import { Board } from "../board";
import { Turn, TilePosition, BoardLine } from "../constants";
import { tileButtonText, tileEmoji, wrap, getScoreBlock } from "./util";
import * as S from "./slack";

export function cactpotView(summary: Summary) {
  const { score, bestScore, turn } = summary;
  const blocks: any[] = [];

  blocks.push(S.Header(S.PlainText(getHeaderCopy(turn))));

  blocks.push(...getBoardBlocks(summary));

  if (score) {
    blocks.push(S.Section(S.Markdown(getScoreBlock("You scored", score))));
  }

  if (bestScore) {
    blocks.push(
      S.Section(
        S.Markdown(getScoreBlock("The best score on this board is", bestScore))
      )
    );
  }

  blocks.push(...getScoreInfoBlocks(score));

  blocks.push(
    S.Context(
      S.PlainText(`Game ID: ${summary.gameId}    Round ID: ${summary.roundId}`)
    )
  );
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

function getBoardBlocks({ board, lineChoice, gameId }: Summary) {
  function getJsonStringValue(value: string) {
    return JSON.stringify({ value, gameId });
  }
  // first row is always the same
  const blocks = [
    S.Actions(
      ...[
        {
          text: ":arrow_lower_right:",
          value: getJsonStringValue(BoardLine.ANTIDIAGONAL),
          action_id: `line-button-${getJsonStringValue(
            BoardLine.ANTIDIAGONAL
          )}`,
        },
        {
          text: ":arrow_down:",
          value: getJsonStringValue(BoardLine.LEFT_COL),
          action_id: `line-button-${getJsonStringValue(BoardLine.LEFT_COL)}`,
        },
        {
          text: ":arrow_down:",
          value: getJsonStringValue(BoardLine.MIDDLE_COL),
          action_id: `line-button-${getJsonStringValue(BoardLine.MIDDLE_COL)}`,
        },
        {
          text: ":arrow_down:",
          value: getJsonStringValue(BoardLine.RIGHT_COL),
          action_id: `line-button-${getJsonStringValue(BoardLine.RIGHT_COL)}`,
        },
        {
          text: ":arrow_lower_left:",
          value: getJsonStringValue(BoardLine.DIAGONAL),
          action_id: `line-button-${getJsonStringValue(BoardLine.DIAGONAL)}`,
        },
      ].map(S.Button)
    ),
  ];

  let tilePosition = 0;
  const rowLines = [
    BoardLine.TOP_ROW,
    BoardLine.MIDDLE_ROW,
    BoardLine.BOTTOM_ROW,
  ];
  board.forEach((row, i) => {
    blocks.push(
      S.Actions(
        S.Button({
          text: ":arrow_right:",
          value: getJsonStringValue(rowLines[i]),
          action_id: `line-button-${getJsonStringValue(rowLines[i])}`,
        }),
        ...row.map((tile) => {
          const value = Object.values(TilePosition)[tilePosition++];
          const selectedTile =
            lineChoice &&
            Board.positionsFromBoardLine(lineChoice).includes(value);
          return S.Button({
            text: selectedTile ? tileEmoji(tile) : tileButtonText(tile),
            value: getJsonStringValue(String(value)),
            action_id: `tile-button-${getJsonStringValue(String(value))}`,
          });
        })
      )
    );
  });

  return blocks;
}

function getScoreInfoBlocks(score: number, rows = 4) {
  const blocks = new Array(rows).fill(0).map(() => S.Context());
  const scoreBlocks = Object.entries(Board.scores).map(([sum, points]) =>
    getScoreInfoBlock([sum, points], score === points)
  );
  while (scoreBlocks.length) {
    for (let i = 0; i < rows; i++) {
      const scoreBlock = scoreBlocks.shift();
      scoreBlock && blocks[i].elements.push(scoreBlock);
    }
  }
  return [S.Context(S.PlainText("Scores")), ...blocks];
}

function getScoreInfoBlock([label, score]: [string, number], selected = false) {
  const totalLength = 8;
  const scoreFmt = score.toLocaleString();
  const spacerLength = totalLength - scoreFmt.length - label.length;

  const text =
    wrap(wrap(label, "`"), "*") +
    wrap(" ".repeat(spacerLength) + score.toLocaleString(), "`");
  // text: `*${label}* | ${score.toLocaleString()}`,
  return S.Markdown(text);
}
