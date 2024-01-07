import { Board, Tile } from "./board";
import { Cactpot } from "./cactpot";
import { TilePosition, BoardLine } from "./constants";

function logDisplay(display: ReturnType<Board["display"]>) {
  display.forEach((row) =>
    console.log(row.map((value) => (value === Tile.HIDDEN ? 0 : value)))
  );
  console.log("\n");
}

const game = new Cactpot();
logDisplay(game.takeTurn(TilePosition.TOP_LEFT));
logDisplay(game.takeTurn(TilePosition.BOTTOM_LEFT));
logDisplay(game.takeTurn(TilePosition.TOP_RIGHT));
logDisplay(game.takeTurn(BoardLine.ANTIDIAGONAL));
console.log(game.getScore());
console.log(game.getBestScore());
console.log("done");
