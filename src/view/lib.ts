import { Tile } from "../board";

export function renderTile(
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

export function wrap(str: string, bookend: string): string {
  return `${bookend}${str}${bookend}`;
}

export function getScoreBlock([label, score]: [string, number]) {
  return {
    type: "mrkdwn",
    text: `${label}: *${score.toLocaleString()}*`,
  };
}
