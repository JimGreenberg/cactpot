import { Summary } from "../cactpot";
import { Board } from "../board";
import { TilePosition, BoardLine } from "../constants";
import { tileButtonText, tileEmoji, getScoreBlock } from "./util";
import { getHeaderCopy, getScoreInfoBlocks, getJsonStringValue } from "./game";
import * as S from "./slack";

export function cactpotFullWidth(summary: Summary) {
  const { score, bestScore, turn, gameId } = summary;
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
    S.Actions(
      S.Button({
        text: "Mobile mode",
        value: getJsonStringValue("", gameId, true),
        action_id: "mobile-button",
      })
    )
  );

  blocks.push(
    S.Context(
      S.PlainText(`Game ID: ${summary.gameId}    Round ID: ${summary.roundId}`)
    )
  );
  return blocks;
}

function getBoardBlocks({ board, lineChoice, gameId }: Summary) {
  // first row is always the same
  const blocks = [
    S.Actions(
      ...[
        [":arrow_lower_right:", BoardLine.ANTIDIAGONAL],
        [":arrow_down:", BoardLine.LEFT_COL],
        [":arrow_down:", BoardLine.MIDDLE_COL],
        [":arrow_down:", BoardLine.RIGHT_COL],
        [":arrow_lower_left:", BoardLine.DIAGONAL],
      ].map(([text, line]) =>
        S.Button({
          text,
          value: getJsonStringValue(line, gameId),
          action_id: `line-button-${line}`,
        })
      )
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
          value: getJsonStringValue(rowLines[i], gameId),
          action_id: `line-button-${rowLines[i]}`,
        }),
        ...row.map((rowTile) => {
          const tile = Object.values(TilePosition)[tilePosition++];
          const selectedTile =
            lineChoice &&
            Board.positionsFromBoardLine(lineChoice).includes(tile);
          return S.Button({
            text: selectedTile ? tileEmoji(rowTile) : tileButtonText(rowTile),
            value: getJsonStringValue(String(tile), gameId),
            action_id: `tile-button-${tile}`,
          });
        })
      )
    );
  });

  return blocks;
}
