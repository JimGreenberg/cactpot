import {
  TilePosition,
  isTilePosition,
  BoardLine,
  isBoardLine,
} from "./constants";

export class Tile {
  static readonly HIDDEN: unique symbol = Symbol("hidden");

  constructor(public value: number, public visible: boolean = false) {}

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
      [tiles[3], tiles[4].reveal(), tiles[5]],
      [tiles[6], tiles[7], tiles[8]],
    ];
  }

  static randomSeedString(): string {
    function shuffle<T>(array: T[]): T[] {
      let currentIndex = array.length,
        randomIndex;

      // While there remain elements to shuffle.
      while (currentIndex > 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex],
          array[currentIndex],
        ];
      }

      return array;
    }

    return shuffle(Array.from({ length: 9 }, (_, i) => i + 1)).join("");
  }

  static readonly scores: Record<number, number> = {
    6: 10000,
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

  private readonly tiles: ThreeByThree<Tile>;

  constructor(
    seedString = Board.randomSeedString(),
    ...itemsToReveal: (TilePosition | BoardLine)[]
  ) {
    this.tiles = Board.tilesFromSeedString(seedString);
    itemsToReveal.forEach((item) => {
      if (isTilePosition(item)) this.getTile(item).reveal();
      if (isBoardLine(item)) this.getLine(item).map((tile) => tile.reveal());
    });
  }

  private getTopRow(): Tile[] {
    return this.tiles[0];
  }
  private getMiddleRow(): Tile[] {
    return this.tiles[1];
  }
  private getBottomRow(): Tile[] {
    return this.tiles[2];
  }
  private getLeftCol(): Tile[] {
    return this.tiles.map(([c]) => c);
  }
  private getMiddleCol(): Tile[] {
    return this.tiles.map(([, c]) => c);
  }
  private getRightCol(): Tile[] {
    return this.tiles.map(([, , c]) => c);
  }
  private getDiagonal(): Tile[] {
    return [
      TilePosition.BOTTOM_LEFT,
      TilePosition.CENTER,
      TilePosition.TOP_RIGHT,
    ].map((pos) => this.getTile(pos));
  }
  private getAntidiagonal(): Tile[] {
    return [
      TilePosition.TOP_LEFT,
      TilePosition.CENTER,
      TilePosition.BOTTOM_RIGHT,
    ].map((pos) => this.getTile(pos));
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
    switch (line) {
      case BoardLine.TOP_ROW:
        return this.getTopRow();
      case BoardLine.MIDDLE_ROW:
        return this.getMiddleRow();
      case BoardLine.BOTTOM_ROW:
        return this.getBottomRow();
      case BoardLine.LEFT_COL:
        return this.getLeftCol();
      case BoardLine.MIDDLE_COL:
        return this.getMiddleCol();
      case BoardLine.RIGHT_COL:
        return this.getRightCol();
      case BoardLine.DIAGONAL:
        return this.getDiagonal();
      case BoardLine.ANTIDIAGONAL:
        return this.getAntidiagonal();
    }
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

  getRevealedCount(): number {
    return this.tiles
      .flat()
      .reduce((acc, curr) => acc + Number(curr.visible), 0);
  }

  display(done = false): ThreeByThree<ReturnType<Tile["display"]>> {
    // @ts-ignore
    return this.tiles.map((row) => row.map((tile) => tile.display(done)));
  }
}
