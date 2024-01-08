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
  lineChoice?: BoardLine;
  seedString: string;
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
  }: {
    seedString: string;
    firstReveal: TilePosition;
    secondReveal: TilePosition;
    thirdReveal: TilePosition;
    lineChoice: BoardLine;
    _id: Types.ObjectId;
    roundId: Types.ObjectId;
  }): Cactpot {
    return new Cactpot(
      new Board(seedString, firstReveal, secondReveal, thirdReveal, lineChoice),
      String(_id), // gameId
      String(roundId),
      lineChoice
    );
  }

  constructor(
    private board: Board = new Board(),
    public readonly gameId: string = "default",
    public readonly roundId: string = "default",
    private lineChoice?: BoardLine
  ) {}

  public get seedString(): string {
    return this.board.seedString;
  }

  private getCurrentTurn(): Turn {
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
    tile.reveal();
  }

  getSummary(): Summary {
    const turn = this.getCurrentTurn();
    const isDone = turn === Turn.FINAL;
    return {
      board: this.board.display(isDone),
      score: this.lineChoice ? this.board.getScore(this.lineChoice) : 0,
      bestScore: isDone ? this.board.getBestScore() : 0,
      turn,
      lineChoice: this.lineChoice,
      seedString: this.board.seedString,
    };
  }

  takeTurn(arg: TilePosition | BoardLine): Summary {
    const turn = this.getCurrentTurn();
    switch (turn) {
      case Turn.INIT:
      case Turn.FIRST:
      case Turn.SECOND:
        if (!isTilePosition(arg)) throw new Errors.InvalidInput();
        this.revealTile(arg);
        break;
      case Turn.THIRD:
        if (!isBoardLine(arg)) throw new Errors.InvalidInput();
        this.lineChoice = arg;
        break;
    }
    return this.getSummary();
  }
}
