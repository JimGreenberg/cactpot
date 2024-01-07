import { Board } from "./board";
import { TilePosition, BoardLine } from "./constants";
import * as Errors from "./error";

export class Cactpot {
  private static *getPlaySequence(game: Cactpot) {
    if (!game.firstReveal) yield game.firstTurn;
    if (!game.secondReveal) yield game.secondTurn;
    if (!game.thirdReveal) yield game.thirdTurn;
    return !game.lineChoice ? game.finalTurn : game.getScore; // getScore here is a failover
  }

  private cactpot: Board;
  private playSequence = Cactpot.getPlaySequence(this);

  constructor(
    seedString?: string,
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
    this.cactpot = new Board(seedString, ...itemsToReveal);
  }

  private checkPos(pos: TilePosition) {
    if ([this.firstReveal, this.secondReveal, this.thirdReveal].includes(pos)) {
      throw new Errors.InvalidMove();
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
    if (!this.lineChoice) throw new Errors.NotDone();
    return this.cactpot.getScore(this.lineChoice);
  }

  getBestScore() {
    if (!this.lineChoice) throw new Errors.NotDone();
    return this.cactpot.getBestScore();
  }
}
