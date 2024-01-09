import { Types } from "mongoose";
import { Board } from "./board";
import {
  TilePosition,
  BoardLine,
  Turn,
  isTilePosition,
  isBoardLine,
} from "./constants";
import * as Errors from "./error";

export interface Summary {
  board: ReturnType<Board["display"]>;
  score: number;
  bestScore: number;
  turn: Turn;
  seedString: string;
  gameId: string;
  roundId: string;
  firstReveal?: TilePosition;
  secondReveal?: TilePosition;
  thirdReveal?: TilePosition;
  lineChoice?: BoardLine;
}

export class Cactpot {
  static fromMongo({
    seedString,
    firstReveal,
    secondReveal,
    thirdReveal,
    lineChoice,
    _id,
    roundId,
    userId,
  }: {
    seedString: string;
    firstReveal: TilePosition;
    secondReveal: TilePosition;
    thirdReveal: TilePosition;
    lineChoice: BoardLine;
    _id: Types.ObjectId;
    roundId: Types.ObjectId;
    userId: string;
  }): Cactpot {
    return new Cactpot(
      new Board(seedString, firstReveal, secondReveal, thirdReveal, lineChoice),
      String(_id), // gameId
      String(roundId),
      userId,
      firstReveal,
      secondReveal,
      thirdReveal,
      lineChoice
    );
  }

  constructor(
    private board: Board = new Board(),
    public readonly gameId: string = "default",
    public readonly roundId: string = "default",
    public readonly userId: string = "default",
    private firstReveal?: TilePosition,
    private secondReveal?: TilePosition,
    private thirdReveal?: TilePosition,
    private lineChoice?: BoardLine
  ) {}

  public get seedString(): string {
    return this.board.seedString;
  }

  getCurrentTurn(): Turn {
    if (this.lineChoice) return Turn.FINAL;
    const revealed = this.board.getRevealedCount();
    switch (revealed) {
      case 1:
        return Turn.INIT;
      case 2:
        return Turn.FIRST;
      case 3:
        return Turn.SECOND;
      case 4:
        return Turn.THIRD;
      default:
        throw new Errors.InvalidBoardState();
    }
  }

  private revealTile(pos: TilePosition) {
    const tile = this.board.getTile(pos);
    if (tile.visible) throw new Errors.InvalidMove();
    return tile.reveal();
  }

  getSummary(): Summary {
    const turn = this.getCurrentTurn();
    const isDone = turn === Turn.FINAL;
    return {
      board: this.board.display(isDone),
      score: this.lineChoice ? this.board.getScore(this.lineChoice) : 0,
      bestScore: isDone ? this.board.getBestScore() : 0,
      turn,
      seedString: this.board.seedString,
      gameId: this.gameId,
      roundId: this.roundId,
      firstReveal: this.firstReveal,
      secondReveal: this.secondReveal,
      thirdReveal: this.thirdReveal,
      lineChoice: this.lineChoice,
    };
  }

  takeTurn(arg: TilePosition | BoardLine): Summary {
    const turn = this.getCurrentTurn();
    switch (turn) {
      case Turn.INIT:
        if (!isTilePosition(arg)) throw new Errors.InvalidInput();
        this.firstReveal = arg;
        this.revealTile(arg);
        break;
      case Turn.FIRST:
        if (!isTilePosition(arg)) throw new Errors.InvalidInput();
        this.secondReveal = arg;
        this.revealTile(arg);
        break;
      case Turn.SECOND:
        if (!isTilePosition(arg)) throw new Errors.InvalidInput();
        this.thirdReveal = arg;
        this.revealTile(arg);
        break;
      case Turn.THIRD:
        if (!isBoardLine(arg)) throw new Errors.InvalidInput();
        this.lineChoice = arg;
        break;
      case Turn.FINAL:
        throw new Errors.Done();
    }
    return this.getSummary();
  }
}
