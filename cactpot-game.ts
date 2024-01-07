import { Cactpot } from "./cactpot";
import { TilePosition, BoardLine } from "./constants";

export class CactpotGame {
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
