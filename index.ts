import { Board, Tile } from "./board";
import { Cactpot } from "./cactpot";
import { TilePosition, BoardLine } from "./constants";

function logBoard(board: ReturnType<Board["display"]>) {
  board.forEach((row) =>
    console.log(row.map((value) => (value === Tile.HIDDEN ? 0 : value)))
  );
  console.log("\n");
}

const game = new Cactpot();
logBoard(game.getSummary().board);

const moves = [
  TilePosition.TOP_LEFT,
  TilePosition.BOTTOM_LEFT,
  TilePosition.TOP_RIGHT,
  BoardLine.ANTIDIAGONAL,
];
for (const move of moves) {
  const { board, score, bestScore } = game.takeTurn(move);
  logBoard(board);
  score && console.log(score);
  bestScore && console.log(bestScore);
}
console.log("done");
