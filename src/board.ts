import "./array";
import {
  TilePosition,
  isTilePosition,
  BoardLine,
  isBoardLine,
} from "./constants";

export class Tile {
  static readonly HIDDEN: unique symbol = Symbol("hidden");

  constructor(public readonly value: number, public visible: boolean = false) {}

  reveal(): Tile {
    this.visible = true;
    return this;
  }

  display(done = false) {
    return this.visible || done ? this.value : Tile.HIDDEN;
  }
}

export type ThreeByThree<T> = [[T, T, T], [T, T, T], [T, T, T]];

export class Board {
  private static tilesFromSeedString(seedString: string): ThreeByThree<Tile> {
    const tiles = seedString
      .split("")
      .map((value) => new Tile(parseInt(value)));
    return [
      [tiles[0], tiles[1], tiles[2]],
      [tiles[3], tiles[4], tiles[5]],
      [tiles[6], tiles[7], tiles[8]],
    ];
  }

  static randomSeedString(): string {
    return Array.from({ length: 9 }, (_, i) => i + 1)
      .shuffle()
      .join("");
  }

  static randomTile(): TilePosition {
    return Object.values(TilePosition).sample();
  }

  static readonly cactpot = 10000;

  static readonly scores: Record<number, number> = {
    6: Board.cactpot,
    7: 36,
    8: 720,
    9: 360,
    10: 80,
    11: 252,
    12: 108,
    13: 72,
    14: 54,
    15: 180,
    16: 72,
    17: 180,
    18: 119,
    19: 36,
    20: 306,
    21: 1080,
    22: 144,
    23: 1800,
    24: 3600,
  };

  static positionsFromBoardLine(line: BoardLine): TilePosition[] {
    return {
      [BoardLine.TOP_ROW]: [
        TilePosition.TOP_LEFT,
        TilePosition.TOP_MIDDLE,
        TilePosition.TOP_RIGHT,
      ],
      [BoardLine.MIDDLE_ROW]: [
        TilePosition.MIDDLE_LEFT,
        TilePosition.CENTER,
        TilePosition.MIDDLE_RIGHT,
      ],
      [BoardLine.BOTTOM_ROW]: [
        TilePosition.BOTTOM_LEFT,
        TilePosition.BOTTOM_MIDDLE,
        TilePosition.BOTTOM_RIGHT,
      ],
      [BoardLine.LEFT_COL]: [
        TilePosition.TOP_LEFT,
        TilePosition.MIDDLE_LEFT,
        TilePosition.BOTTOM_LEFT,
      ],
      [BoardLine.MIDDLE_COL]: [
        TilePosition.TOP_MIDDLE,
        TilePosition.CENTER,
        TilePosition.BOTTOM_MIDDLE,
      ],
      [BoardLine.RIGHT_COL]: [
        TilePosition.TOP_RIGHT,
        TilePosition.MIDDLE_RIGHT,
        TilePosition.BOTTOM_RIGHT,
      ],
      [BoardLine.DIAGONAL]: [
        TilePosition.BOTTOM_LEFT,
        TilePosition.CENTER,
        TilePosition.TOP_RIGHT,
      ],
      [BoardLine.ANTIDIAGONAL]: [
        TilePosition.TOP_LEFT,
        TilePosition.CENTER,
        TilePosition.BOTTOM_RIGHT,
      ],
    }[line];
  }

  private readonly tiles: ThreeByThree<Tile>;

  constructor(
    public readonly seedString = Board.randomSeedString(),
    public readonly initialReveal: TilePosition = Board.randomTile(),
    ...itemsToReveal: (TilePosition | BoardLine)[]
  ) {
    this.tiles = Board.tilesFromSeedString(seedString);
    [initialReveal, ...itemsToReveal].forEach((item) => {
      if (isTilePosition(item)) this.getTile(item).reveal();
      if (isBoardLine(item)) this.getLine(item).map((tile) => tile.reveal());
    });
  }

  getTile(position: TilePosition): Tile {
    const [row, col] = {
      [TilePosition.TOP_LEFT]: [0, 0],
      [TilePosition.TOP_MIDDLE]: [0, 1],
      [TilePosition.TOP_RIGHT]: [0, 2],
      [TilePosition.MIDDLE_LEFT]: [1, 0],
      [TilePosition.CENTER]: [1, 1],
      [TilePosition.MIDDLE_RIGHT]: [1, 2],
      [TilePosition.BOTTOM_LEFT]: [2, 0],
      [TilePosition.BOTTOM_MIDDLE]: [2, 1],
      [TilePosition.BOTTOM_RIGHT]: [2, 2],
    }[position];
    return this.tiles[row][col];
  }

  getLine(line: BoardLine): Tile[] {
    return Board.positionsFromBoardLine(line).map((pos) => this.getTile(pos));
  }

  getScore(line: BoardLine): number {
    return Board.scores[
      this.getLine(line)
        .map(({ value }) => value)
        .reduce((a, c) => a + c, 0)
    ];
  }

  getBestScore(): number {
    return Math.max(
      ...Object.values(BoardLine).map((line) => this.getScore(line))
    );
  }

  display(done = false): ThreeByThree<ReturnType<Tile["display"]>> {
    // @ts-ignore
    return this.tiles.map((row) => row.map((tile) => tile.display(done)));
  }
}
