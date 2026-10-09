import { BooleanSchemaDefinition } from "mongoose";
import { Cactpot } from "../cactpot";
import { Board } from "../board";
import { TilePosition } from "../constants";
const { createCanvas } = require("canvas");

export const SIZE = 180;
const CELL_SIZE = SIZE / 3;

function positionToCoords(pos: TilePosition): readonly [number, number] {
  return (
    {
      [TilePosition.TOP_LEFT]: [0, 0],
      [TilePosition.TOP_MIDDLE]: [0, 1],
      [TilePosition.TOP_RIGHT]: [0, 2],
      [TilePosition.MIDDLE_LEFT]: [1, 0],
      [TilePosition.CENTER]: [1, 1],
      [TilePosition.MIDDLE_RIGHT]: [1, 2],
      [TilePosition.BOTTOM_LEFT]: [2, 0],
      [TilePosition.BOTTOM_MIDDLE]: [2, 1],
      [TilePosition.BOTTOM_RIGHT]: [2, 2],
    } as const
  )[pos];
}
function coordsToPosition(row: number, col: number): TilePosition {
  return Object.values(TilePosition)[3 * row + col];
}

const emojiMap = {
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣",
  9: "9️⃣",
};

function drawBlankBoard(): CanvasRenderingContext2D {
  const canvas = createCanvas();
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("error getting canvas");
  }

  canvas.width = SIZE;
  canvas.height = SIZE;

  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 4;

  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(SIZE, i * CELL_SIZE);
    ctx.stroke();
  }

  return ctx;
}

function drawTileOnBoard(
  ctx: CanvasRenderingContext2D,
  tileNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  position: TilePosition,
  emoji: boolean = false,
  color = "black",
): void {
  ctx.restore();
  const [row, col] = positionToCoords(position);

  const x = col * CELL_SIZE + CELL_SIZE / 2;
  const y = row * CELL_SIZE + CELL_SIZE / 2;

  ctx.font = `${CELL_SIZE * 0.5}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(`${emoji ? emojiMap[tileNumber] : tileNumber}`, x, y);
}

const FPS = 1;

export async function makeReplayGif(encoder: any, game: Cactpot) {
  const {
    board,
    initialReveal,
    initialRevealValue,
    reveals,
    revealValues,
    lineChoice,
  } = game.getSummary();
  const ctx = drawBlankBoard();
  drawTileOnBoard(ctx, initialRevealValue as 1, initialReveal);
  encoder.setRepeat(0);
  encoder.setDelay(1000 / FPS);
  encoder.setQuality(30);
  encoder.setTransparent(0);
  encoder.start();
  encoder.addFrame(ctx);
  for (let frame = 0; frame < reveals.length * FPS; frame++) {
    drawTileOnBoard(ctx, revealValues[frame] as 1, reveals[frame]);
    encoder.addFrame(ctx);
    // yield so the Slack socket can answer heartbeats while we encode
    await new Promise(setImmediate);
  }
  const finalCtx = drawBlankBoard();
  board.forEach((row, i) =>
    row.forEach((tile, j) => {
      const tilePosition = coordsToPosition(i, j);
      drawTileOnBoard(
        finalCtx,
        tile as 1,
        tilePosition,
        Board.positionsFromBoardLine(lineChoice!).includes(tilePosition),
        [initialRevealValue, ...revealValues].includes(tile as 1)
          ? "black"
          : "gray",
      );
    }),
  );
  encoder.addFrame(finalCtx);
  encoder.addFrame(finalCtx);
  encoder.addFrame(finalCtx); // repeat so it shows longer
  encoder.finish();
}
