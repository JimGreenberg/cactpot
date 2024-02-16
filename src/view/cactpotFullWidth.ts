import { Summary } from "../cactpot";
import { Board } from "../board";
import { TilePosition, BoardLine } from "../constants";
import { tileButtonText, tileEmoji, getScoreBlock } from "./util";
import { getHeaderCopy, getScoreInfoBlocks } from "./game";
import * as S from "./slack";

export function cactpotFullWidth(summary: Summary) {
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
