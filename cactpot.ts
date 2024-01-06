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

enum BoardRow {
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

  constructor(public value: number, public visible: boolean = false) {}

  reveal(): Tile {
    this.visible = true;
    return this;
  }

  display(done = false) {
    return this.visible || done ? this.value : Tile.HIDDEN;
  }
}

type ThreeByThree<T> = [[T, T, T], [T, T, T], [T, T, T]];
type Board = ThreeByThree<Tile>;

class Cactpot {
  private static randomSeedString(): string {
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

  private static boardFromSeedString(seedString: string): Board {
    const tiles = seedString
      .split("")
      .map((value) => new Tile(parseInt(value)));
    return [
      [tiles[0], tiles[1], tiles[2]],
      [tiles[3], tiles[4].reveal(), tiles[5]],
      [tiles[6], tiles[7], tiles[8]],
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

  private readonly board: Board;

  constructor(seedString = Cactpot.randomSeedString()) {
    this.board = Cactpot.boardFromSeedString(seedString);
  }

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

  getRow(row: BoardRow): Tile[] {
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

  getScore(row: BoardRow): number {
    return Cactpot.scores[
      this.getRow(row)
        .map(({ value }) => value)
        .reduce((a, c) => a + c, 0)
    ];
  }

  getBestScore(): number {
    return Math.max(
      ...Object.values(BoardRow).map((row) => this.getScore(row))
    );
  }

  display(done = false): ThreeByThree<ReturnType<Tile["display"]>> {
    // @ts-ignore
    return this.board.map((row) => row.map((tile) => tile.display(done)));
  }
}

class CactpotGame {
  private playSequence: ReturnType<CactpotGame["getPlaySequence"]>;

  public firstReveal?: TilePosition;
  public secondReveal?: TilePosition;
  public thirdReveal?: TilePosition;
  public rowChoice?: BoardRow;

  constructor(
    private cactpot: Cactpot,
    firstReveal?: TilePosition,
    secondReveal?: TilePosition,
    thirdReveal?: TilePosition,
    rowChoice?: BoardRow
  ) {
    this.playSequence = this.getPlaySequence();
    if (firstReveal) this.firstTurn(firstReveal);
    if (secondReveal) this.secondTurn(secondReveal);
    if (thirdReveal) this.thirdTurn(thirdReveal);
    if (rowChoice) this.finalTurn(rowChoice);
  }

  private checkPos(pos: TilePosition) {
    if ([this.firstReveal, this.secondReveal, this.thirdReveal].includes(pos)) {
      throw new Error("You already revealed that tile");
    }
  }

  private firstTurn(pos: TilePosition) {
    this.checkPos(pos);
    this.firstReveal = pos;
    this.cactpot.getTile(pos).reveal();
  }

  private secondTurn(pos: TilePosition) {
    this.checkPos(pos);
    this.secondReveal = pos;
    this.cactpot.getTile(pos).reveal();
  }

  private thirdTurn(pos: TilePosition) {
    this.checkPos(pos);
    this.thirdReveal = pos;
    this.cactpot.getTile(pos).reveal();
  }

  private finalTurn(row: BoardRow) {
    this.rowChoice = row;
    this.cactpot.getRow(row).forEach((tile) => tile.reveal());
  }

  private *getPlaySequence() {
    if (!this.firstReveal) yield this.firstTurn;
    if (!this.secondReveal) yield this.secondTurn;
    if (!this.thirdReveal) yield this.thirdTurn;
    return !this.rowChoice ? this.finalTurn : this.getScore; // getScore here is a failover
  }

  takeTurn(arg: TilePosition | BoardRow) {
    const turn = this.playSequence.next();
    // @ts-ignore
    turn.value.call(this, arg);
    return this.cactpot.display(turn.done); // .done is on the generator result, so this is actually checking whether the playsequence is done
  }

  getScore() {
    if (!this.rowChoice) throw new Error("You aren't done yet!");
    return this.cactpot.getScore(this.rowChoice);
  }

  getBestScore() {
    if (!this.rowChoice) throw new Error("You aren't done yet!");
    return this.cactpot.getBestScore();
  }
}

const game = new CactpotGame(new Cactpot());
console.log(game.takeTurn(0));
console.log(game.takeTurn(1));
console.log(game.takeTurn(2));
console.log(game.takeTurn(BoardRow.ANTIDIAGONAL));
console.log(game.getScore());
console.log(game.getBestScore());
console.log("done");
