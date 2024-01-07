enum TilePosition {
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
function isTilePosition(arg: keyof any): arg is TilePosition {
  return arg in TilePosition;
}

enum BoardLine {
  TOP_ROW = "TOP_ROW",
  MIDDLE_ROW = "MIDDLE_ROW",
  BOTTOM_ROW = "BOTTOM_ROW",
  LEFT_COL = "LEFT_COL",
  MIDDLE_COL = "MIDDLE_COL",
  RIGHT_COL = "RIGHT_COL",
  DIAGONAL = "DIAGONAL",
  ANTIDIAGONAL = "ANTIDIAGONAL",
}

function isBoardLine(arg: keyof any): arg is BoardLine {
  return arg in BoardLine;
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

  private readonly board: Board;

  constructor(
    seedString = Cactpot.randomSeedString(),
    ...itemsToReveal: (TilePosition | BoardLine)[]
  ) {
    this.board = Cactpot.boardFromSeedString(seedString);
    itemsToReveal.forEach((item) => {
      if (isTilePosition(item)) this.getTile(item).reveal();
      if (isBoardLine(item)) this.getLine(item).map((tile) => tile.reveal());
    });
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
    return Cactpot.scores[
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
    return this.board.map((row) => row.map((tile) => tile.display(done)));
  }
}

const enum Turn {
  INIT,
  FIRST,
  SECOND,
  THIRD,
  FINAL,
}

const copy = {
  [Turn.INIT]: "Select three slots to uncover",
  [Turn.FIRST]: "Select two slots to uncover",
  [Turn.SECOND]: "Select one slot to uncover",
  [Turn.THIRD]: "Select a line to add up",
  [Turn.FINAL]: "Score",
};

class CactpotGame {
  private static *getPlaySequence(game: CactpotGame) {
    if (!game.firstReveal) yield game.firstTurn;
    if (!game.secondReveal) yield game.secondTurn;
    if (!game.thirdReveal) yield game.thirdTurn;
    return !game.lineChoice ? game.finalTurn : game.getScore; // getScore here is a failover
  }

  private cactpot: Cactpot;
  private playSequence: ReturnType<(typeof CactpotGame)["getPlaySequence"]>;

  constructor(
    seedString: string = Cactpot.randomSeedString(),
    public firstReveal?: TilePosition,
    public secondReveal?: TilePosition,
    public thirdReveal?: TilePosition,
    public lineChoice?: BoardLine
  ) {
    const itemsToReveal = [
      firstReveal,
      secondReveal,
      thirdReveal,
      lineChoice,
    ].filter(Boolean as unknown as (arg) => arg is TilePosition | BoardLine);
    this.cactpot = new Cactpot(seedString, ...itemsToReveal);
    this.playSequence = CactpotGame.getPlaySequence(this);
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

  private finalTurn(line: BoardLine) {
    this.lineChoice = line;
    this.cactpot.getLine(line).forEach((tile) => tile.reveal());
  }

  takeTurn(arg: TilePosition | BoardLine) {
    const { value: turnFn, done } = this.playSequence.next();
    // @ts-ignore
    turnFn.call(this, arg);
    return this.cactpot.display(done);
  }

  getScore() {
    if (!this.lineChoice) throw new Error("You aren't done yet!");
    return this.cactpot.getScore(this.lineChoice);
  }

  getBestScore() {
    if (!this.lineChoice) throw new Error("You aren't done yet!");
    return this.cactpot.getBestScore();
  }
}

function logDisplay(display: ReturnType<Cactpot["display"]>) {
  display.forEach((row) =>
    console.log(row.map((value) => (value === Tile.HIDDEN ? 0 : value)))
  );
  console.log("\n");
}

// const game = new CactpotGame(Cactpot.randomSeedString(), 1, 2, 3);
const game = new CactpotGame();
logDisplay(game.takeTurn(TilePosition.TOP_LEFT));
logDisplay(game.takeTurn(TilePosition.BOTTOM_LEFT));
logDisplay(game.takeTurn(TilePosition.TOP_RIGHT));
logDisplay(game.takeTurn(BoardLine.ANTIDIAGONAL));
console.log(game.getScore());
console.log(game.getBestScore());
console.log("done");
