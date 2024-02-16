import { Summary } from "../cactpot";
import { Board } from "../board";
import { Turn, TilePosition, BoardLine } from "../constants";
import {
  wrap,
  tileChar,
  getScoreBlock,
  tilePositionText,
  boardLineText,
} from "./util";
import { getScoreInfoBlocks } from "./game";
import * as S from "./slack";

export function getJsonStringValue(value: string, gameId: string) {
  return JSON.stringify({ value, gameId });
}

export function cactpotMobile(summary: Summary) {
  const { score, bestScore, turn, gameId } = summary;
  const blocks: any[] = [];

  blocks.push(...getBoardBlocks(summary));

  if ([Turn.INIT, Turn.FIRST, Turn.SECOND].includes(turn)) {
    blocks.push(S.Actions(...getTileActions(gameId)));
  }

  if (turn === Turn.THIRD) {
    blocks.push(S.Actions(...getLineChoiceActions(gameId)));
  }

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

function getBoardBlocks({ board, lineChoice }: Summary) {
  let tilePosition = 0;

  return board.map((row) =>
    S.Section(
      S.Markdown(
        row
          .map((tile) => {
            const value = Object.values(TilePosition)[tilePosition++];
            const selectedTile =
              lineChoice &&
              Board.positionsFromBoardLine(lineChoice).includes(value);
            const char = wrap(wrap(tileChar(tile), " "), "`");

            return wrap(selectedTile ? wrap(char, "*") : char, " ");
          })
          .join(" ")
      )
    )
  );
}

function getTileActions(gameId: string) {
  return Object.values(TilePosition)
    .map((tile) => ({
      text: tilePositionText(tile),
      value: getJsonStringValue(tile, gameId),
      action_id: `tile-button-${getJsonStringValue(tile, gameId)}`,
    }))
    .map(S.Button);
}

function getLineChoiceActions(gameId: string) {
  return Object.values(BoardLine)
    .map((line) => ({
      text: boardLineText(line),
      value: getJsonStringValue(line, gameId),
      action_id: `line-button-${getJsonStringValue(line, gameId)}`,
    }))
    .map(S.Button);
}
