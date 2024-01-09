export enum TilePosition {
  TOP_LEFT = "TOP_LEFT",
  TOP_MIDDLE = "TOP_MIDDLE",
  TOP_RIGHT = "TOP_RIGHT",
  MIDDLE_LEFT = "MIDDLE_LEFT",
  CENTER = "CENTER",
  MIDDLE_RIGHT = "MIDDLE_RIGHT",
  BOTTOM_LEFT = "BOTTOM_LEFT",
  BOTTOM_MIDDLE = "BOTTOM_MIDDLE",
  BOTTOM_RIGHT = "BOTTOM_RIGHT",
}
export function isTilePosition(arg: keyof any): arg is TilePosition {
  return arg in TilePosition;
}

export enum BoardLine {
  TOP_ROW = "TOP_ROW",
  MIDDLE_ROW = "MIDDLE_ROW",
  BOTTOM_ROW = "BOTTOM_ROW",
  LEFT_COL = "LEFT_COL",
  MIDDLE_COL = "MIDDLE_COL",
  RIGHT_COL = "RIGHT_COL",
  DIAGONAL = "DIAGONAL",
  ANTIDIAGONAL = "ANTIDIAGONAL",
}

export function isBoardLine(arg: keyof any): arg is BoardLine {
  return arg in BoardLine;
}

export const enum Turn {
  INIT,
  FIRST,
  SECOND,
  THIRD,
  FINAL,
}
