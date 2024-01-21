import { Tile } from "../board";
import { BoardLine } from "../constants";

export function tileButtonText(value: number | typeof Tile.HIDDEN): string {
  if (value === Tile.HIDDEN) return " ";
  return String(value);
}

export function tileChar(value: number | typeof Tile.HIDDEN): string {
  if (value === Tile.HIDDEN) return "_";
  return String(value);
}

export function tileEmoji(value: number | typeof Tile.HIDDEN): string {
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
      return " ";
  }
}

export function wrap(str: string, bookend: string): string {
  return `${bookend}${str}${bookend}`;
}

export function getScoreBlock(label: string, score = 0) {
  return `${label}: *${score.toLocaleString()}*`;
}

export function boardLineText(line: BoardLine): string {
  return {
    [BoardLine.TOP_ROW]: "Top Row",
    [BoardLine.MIDDLE_ROW]: "Middle Row",
    [BoardLine.BOTTOM_ROW]: "Bottom Row",
    [BoardLine.LEFT_COL]: "Left Column",
    [BoardLine.MIDDLE_COL]: "Middle Column",
    [BoardLine.RIGHT_COL]: "Right Column",
    [BoardLine.DIAGONAL]: "Upwards Diagonal",
    [BoardLine.ANTIDIAGONAL]: "Downwards Diagonal",
  }[line];
}
