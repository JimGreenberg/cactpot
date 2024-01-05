const enum TilePosition {
  TOP_LEFT,
  TOP_MIDDLE,
  TOP_RIGHT,
  MIDDLE_LEFT,
  CENTER,
  MIDDLE_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_MIDDLE,
  BOTTOM_RIGHT,
}

const enum BoardRow {
  TOP_ROW = "TOP_ROW",
  MIDDLE_ROW = "MIDDLE_ROW",
  BOTTOM_ROW = "BOTTOM_ROW",
  LEFT_COL = "LEFT_COL",
  MIDDLE_COL = "MIDDLE_COL",
  RIGHT_COL = "RIGHT_COL",
  DIAGONAL = "DIAGONAL",
  ANTIDIAGONAL = "ANTIDIAGONAL",
}

class Tile {
  static readonly HIDDEN: unique symbol = Symbol("hidden");

  constructor(private value: number, private visible: boolean = false) {}

  reveal(): Tile {
    this.visible = true;
    return this;
  }

  display() {
    return this.visible ? this.value : Tile.HIDDEN;
  }

  finalDisplay() {
    return this.value;
  }
}

type ThreeByThree<T> = [[T, T, T], [T, T, T], [T, T, T]];
type Board = ThreeByThree<Tile>;

class Cactpot {
  private static randomBoard(): Board {
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

    const random = shuffle(Array.from({ length: 9 }, (_, i) => i + 1)).map(
      (value) => new Tile(value)
    );
    return [
      [random[0], random[1], random[2]],
      [random[3], random[4].reveal(), random[5]],
      [random[6], random[7], random[8]],
    ];
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

  private getTopRow(): Tile[] {
    return this.board[0];
  }
  private getMiddleRow(): Tile[] {
    return this.board[1];
  }
  private getBottomRow(): Tile[] {
    return this.board[2];
  }
  private getLeftCol(): Tile[] {
    return this.board.map(([c]) => c);
  }
  private getMiddleCol(): Tile[] {
    return this.board.map(([, c]) => c);
  }
  private getRightCol(): Tile[] {
    return this.board.map(([, , c]) => c);
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
    return this.board[row][col];
  }

  getRow(row: BoardRow) {
    switch (row) {
      case BoardRow.TOP_ROW:
        return this.getTopRow();
      case BoardRow.MIDDLE_ROW:
        return this.getMiddleRow();
      case BoardRow.BOTTOM_ROW:
        return this.getBottomRow();
      case BoardRow.LEFT_COL:
        return this.getLeftCol();
      case BoardRow.MIDDLE_COL:
        return this.getMiddleCol();
      case BoardRow.RIGHT_COL:
        return this.getRightCol();
      case BoardRow.DIAGONAL:
        return this.getDiagonal();
      case BoardRow.ANTIDIAGONAL:
        return this.getAntidiagonal();
    }
  }

  private readonly board = Cactpot.randomBoard();

  display(): ThreeByThree<ReturnType<Tile["display"]>> {
    // @ts-ignore
    return this.board.map((row) => row.map((tile) => tile.display()));
  }

  finalDisplay(): ThreeByThree<number> {
    // @ts-ignore
    return this.board.map((row) => row.map((tile) => tile.finalDisplay()));
  }
}

class CactpotGame {
  private static *playSequence(cactpot: Cactpot) {
    yield (tile: TilePosition) => cactpot.getTile(tile).reveal();
    yield (tile: TilePosition) => cactpot.getTile(tile).reveal();
    yield (tile: TilePosition) => cactpot.getTile(tile).reveal();
    return (row: BoardRow) =>
      cactpot.getRow(row).forEach((tile) => tile.reveal());
  }

  firstReveal?: TilePosition;
  secondReveal?: TilePosition;
  thirdReveal?: TilePosition;
  rowChoice?: BoardRow;

  private playSequence: ReturnType<typeof CactpotGame.playSequence>;

  constructor(private cactpot: Cactpot) {
    this.playSequence = CactpotGame.playSequence(cactpot);
  }

  takeTurn(arg: TilePosition | BoardRow) {
    const turn = this.playSequence.next();
    // @ts-ignore
    turn.value?.(arg);
    return turn.done ? this.cactpot.finalDisplay() : this.cactpot.display();
  }
}

// const game = new CactpotGame(new Cactpot());
// console.log(game.takeTurn(0));
// console.log(game.takeTurn(1));
// console.log(game.takeTurn(2));
// console.log(game.takeTurn(BoardRow.ANTIDIAGONAL));
// console.log("done");
