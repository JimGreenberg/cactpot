import { Types } from "mongoose";
import { Board, Tile } from "./board";
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
  initialReveal: TilePosition;
  reveals: TilePosition[];
  revealValues: number[];
  lineChoice?: BoardLine;
}

export class Cactpot {
  static fromMongo({
    round: { seedString, initialReveal, _id: roundId },
    _id: gameId,
    reveals,
    lineChoice,
    userId,
  }: {
    round: {
      seedString: string;
      initialReveal: TilePosition;
      _id: Types.ObjectId;
    };
    reveals: TilePosition[];
    lineChoice: BoardLine;
    _id: Types.ObjectId;
    userId: string;
  }): Cactpot {
    return new Cactpot(
      new Board(seedString, initialReveal, ...reveals, lineChoice),
      String(gameId),
      String(roundId),
      userId,
      reveals,
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
  public get initialReveal(): TilePosition {
    return this.board.initialReveal;
  }

  getCurrentTurn(): Turn {
    if (this.lineChoice) return Turn.FINAL;
    switch (this.reveals.length) {
      case 0:
        return Turn.INIT;
      case 1:
        return Turn.FIRST;
      case 2:
        return Turn.SECOND;
      case 3:
        return Turn.THIRD;
      default:
        throw new Errors.InvalidBoardState();
    }
  }

  private revealTile(pos: TilePosition) {
    const tile = this.board.getTile(pos);
    if (tile.visible) throw new Errors.InvalidMove(pos);
    return tile.reveal();
  }

  takeTurn(arg: TilePosition | BoardLine): Summary {
    const turn = this.getCurrentTurn();
    switch (turn) {
      case Turn.INIT:
      case Turn.FIRST:
      case Turn.SECOND:
        if (!isTilePosition(arg)) throw new Errors.InvalidInput(arg);
        this.reveals.push(arg);
        this.revealTile(arg);
        break;
      case Turn.THIRD:
        if (!isBoardLine(arg)) throw new Errors.InvalidInput(arg);
        this.lineChoice = arg;
        break;
      case Turn.FINAL:
        throw new Errors.Done();
    }
    return this.getSummary();
  }

  getScore(): number {
    return this.lineChoice ? this.board.getScore(this.lineChoice) : 0;
  }

  getSummary(): Summary {
    const turn = this.getCurrentTurn();
    const isDone = turn === Turn.FINAL;
    return {
      board: this.board.display(isDone),
      score: this.getScore(),
      bestScore: isDone ? this.board.bestScore : 0,
      turn,
      seedString: this.board.seedString,
      gameId: this.gameId,
      roundId: this.roundId,
      initialReveal: this.board.initialReveal,
      reveals: this.reveals,
      revealValues: this.reveals.map((pos) => this.board.getTile(pos).value),
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
    const bestScore = this.board.bestScore;
    return {
      bestScore,
      cactpotPossible: bestScore === Board.cactpot,
      score: this.board.getScore(this.lineChoice!),
    };
  }
}
