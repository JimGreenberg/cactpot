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
}

export class Cactpot {
  private lineChoice: BoardLine;
  constructor(private board: Board = new Board()) {}

  private getCurrentTurn(): Turn {
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
      case 9:
        return Turn.FINAL;
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
      score: isDone ? this.board.getScore(this.lineChoice) : 0,
      bestScore: isDone ? this.board.getBestScore() : 0,
      turn,
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
