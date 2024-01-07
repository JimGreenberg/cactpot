import { Cactpot, Tile } from "./cactpot";
import { CactpotGame } from "./cactpot-game";
import { TilePosition, BoardLine } from "./constants";

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
