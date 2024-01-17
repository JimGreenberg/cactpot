import { Tile } from "../board";
import { BoardLine } from "../constants";

export function renderTile(
  value: number | typeof Tile.HIDDEN,
  emoji = false
): string {
  if (value === Tile.HIDDEN) return " ";
  if (!emoji) return String(value);
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

export function wrap(str: string, bookend: string): string {
  return `${bookend}${str}${bookend}`;
}

export function getScoreBlock([label, score = 0]: [string, number]) {
  return {
    type: "mrkdwn",
    text: `${label}: *${score.toLocaleString()}*`,
  };
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

/** subtype of slack user */
export interface User {
  profile: {
    display_name: string;
    image_24: string;
  };
}