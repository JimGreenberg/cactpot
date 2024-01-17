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
  reveals: TilePosition[];
  lineChoice?: BoardLine;
}

export class Cactpot {
  static fromMongo({
    seedString,
    initialReveal,
    firstReveal,
    secondReveal,
    thirdReveal,
    lineChoice,
    _id,
    roundId,
    userId,
  }: {
    seedString: string;
    initialReveal: TilePosition;
    firstReveal: TilePosition;
    secondReveal: TilePosition;
    thirdReveal: TilePosition;
    lineChoice: BoardLine;
    _id: Types.ObjectId;
    roundId: Types.ObjectId;
    userId: string;
  }): Cactpot {
    return new Cactpot(
      new Board(
        seedString,
        initialReveal,
        firstReveal,
        secondReveal,
        thirdReveal,
        lineChoice
      ),
      String(_id), // gameId
      String(roundId),
      userId,
      [firstReveal, secondReveal, thirdReveal],
      lineChoice
    );
  }

  constructor(
    private board: Board = new Board(),
    public readonly gameId: string = "default",
    public readonly roundId: string = "default",
    public readonly userId: string = "default",
    private reveals: TilePosition[] = [],
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

  takeTurn(arg: TilePosition | BoardLine): Summary {
    const turn = this.getCurrentTurn();
    switch (turn) {
      case Turn.INIT:
      case Turn.FIRST:
      case Turn.SECOND:
        if (!isTilePosition(arg)) throw new Errors.InvalidInput();
        this.reveals.push(arg);
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
      reveals: this.reveals,
      lineChoice: this.lineChoice,
    };
  }

  leaderboardInfo():
    | {
        cactpotPossible: boolean;
        score: number;
        bestScore: number;
      }
    | undefined {
    const turn = this.getCurrentTurn();
    const isDone = turn === Turn.FINAL;
    if (!isDone) return;
    const bestScore = this.board.getBestScore();
    return {
      bestScore,
      cactpotPossible: bestScore === Board.cactpot,
      score: this.board.getScore(this.lineChoice!),
    };
  }
}
