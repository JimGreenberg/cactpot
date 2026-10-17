import fs from "fs";
import path from "path";
import { Cactpot } from "../cactpot";
import { Board } from "../board";
import { TilePosition, BoardLine } from "../constants";
import {
  createCanvas,
  loadImage,
  Canvas,
  CanvasRenderingContext2D as CanvasCtx,
} from "canvas";

const FONT_FAMILY = "Lato, Ubuntu, sans-serif";

function coordsToPosition(row: number, col: number): TilePosition {
  return Object.values(TilePosition)[3 * row + col];
}

async function image(filename: string) {
  const pngFilename = filename.endsWith(".png") ? filename : filename + ".png";
  const pngPath = path.join(__dirname, "..", "..", "static", pngFilename);
  const pngBuffer = fs.readFileSync(pngPath);
  return await loadImage(pngBuffer);
}

// based on emptyBoard2.png
const ROW_Y0 = 70;
const ROW_GAP = 154;
const row_y = (i: number) => ROW_Y0 + i * ROW_GAP;

const COLUMN_X0 = 124;
const COLUMN_GAP = 224;
const column_x = (i: number) => COLUMN_X0 + i * COLUMN_GAP;

const ROW_Y = Array(4)
  .fill(0)
  .map((_, i) => row_y(i));
const COLUMN_X = Array(5)
  .fill(0)
  .map((_, i) => column_x(i));

const tiles = {
  [TilePosition.TOP_LEFT]: [COLUMN_X[1], ROW_Y[1]],
  [TilePosition.TOP_MIDDLE]: [COLUMN_X[2], ROW_Y[1]],
  [TilePosition.TOP_RIGHT]: [COLUMN_X[3], ROW_Y[1]],
  [TilePosition.MIDDLE_LEFT]: [COLUMN_X[1], ROW_Y[2]],
  [TilePosition.CENTER]: [COLUMN_X[2], ROW_Y[2]],
  [TilePosition.MIDDLE_RIGHT]: [COLUMN_X[3], ROW_Y[2]],
  [TilePosition.BOTTOM_LEFT]: [COLUMN_X[1], ROW_Y[3]],
  [TilePosition.BOTTOM_MIDDLE]: [COLUMN_X[2], ROW_Y[3]],
  [TilePosition.BOTTOM_RIGHT]: [COLUMN_X[3], ROW_Y[3]],
};

const lines = {
  [BoardLine.TOP_ROW]: Array(4)
    .fill(0)
    .map((_, i) => [COLUMN_X[1], ROW_Y[i]]),
  [BoardLine.MIDDLE_ROW]: Array(4)
    .fill(0)
    .map((_, i) => [COLUMN_X[2], ROW_Y[i]]),
  [BoardLine.BOTTOM_ROW]: Array(4)
    .fill(0)
    .map((_, i) => [COLUMN_X[3], ROW_Y[i]]),
  [BoardLine.LEFT_COL]: Array(4)
    .fill(0)
    .map((_, i) => [COLUMN_X[i], ROW_Y[1]]),
  [BoardLine.MIDDLE_COL]: Array(4)
    .fill(0)
    .map((_, i) => [COLUMN_X[i], ROW_Y[2]]),
  [BoardLine.RIGHT_COL]: Array(4)
    .fill(0)
    .map((_, i) => [COLUMN_X[i], ROW_Y[3]]),
  [BoardLine.DIAGONAL]: Array(4)
    .fill(0)
    .map((_, i) => [COLUMN_X[i + 1], ROW_Y[3 - i]]),
  [BoardLine.ANTIDIAGONAL]: Array(4)
    .fill(0)
    .map((_, i) => [COLUMN_X[i], ROW_Y[i]]),
};

const emojis = {
  1: "one.png",
  2: "two.png",
  3: "three.png",
  4: "four.png",
  5: "five.png",
  6: "six.png",
  7: "seven.png",
  8: "eight.png",
  9: "nine.png",
};

async function drawTileOnBoard(
  ctx: CanvasCtx,
  val: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  position: TilePosition,
  emoji = false,
) {
  const [x, y] = tiles[position];
  if (emoji) {
    const emoji = await image(emojis[val]);
    const size = 32;
    ctx.drawImage(emoji, x - size / 2, y - size / 2, size, size);
    return;
  }
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `bold 40px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(val), x, y);
}

// TODO: numbers out of date
function encircleNumber(ctx: CanvasCtx, position: TilePosition, color = "red") {
  const [x, y] = tiles[position];
  const size = 36;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, 8);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function highlightTile(
  ctx: CanvasCtx,
  x: number,
  y: number,
  color = "gold",
  opacity = 0.3,
) {
  const width = 190;
  const height = 92;
  ctx.beginPath();
  ctx.roundRect(x - 6 - width / 2, y - 1 - height / 2, width, height, 10);
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function outlineTile(ctx: CanvasCtx, position: TilePosition, color = "red") {
  const [x, y] = tiles[position];
  const width = 190;
  const height = 92;
  ctx.beginPath();
  ctx.roundRect(x - 6 - width / 2, y - 1 - height / 2, width, height, 10);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

// TODO: numbers out of date
function drawLine(ctx: CanvasCtx, ...positions: TilePosition[]) {
  const half = 19;
  ctx.beginPath();
  for (let i = 0; i < positions.length - 1; i++) {
    const [x1, y1] = tiles[positions[i]];
    const [x2, y2] = tiles[positions[i + 1]];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const scale = half / Math.max(Math.abs(dx), Math.abs(dy));
    ctx.moveTo(x1 + dx * scale, y1 + dy * scale);
    ctx.lineTo(x2 - dx * scale, y2 - dy * scale);
  }
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBadge(
  ctx: CanvasCtx,
  val: number,
  position: TilePosition,
  color = "red",
) {
  const [x, y] = tiles[position];
  const bx = x + 88;
  const by = y - 46;
  ctx.beginPath();
  ctx.arc(bx, by, 16, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `bold 22px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(val), bx, by);
}

function drawInitialRevealBadge(
  ctx: CanvasCtx,
  position: TilePosition,
  color = "red",
) {
  const [x, y] = tiles[position];
  const bx = x + 68;
  const by = y - 46;
  const width = 64;
  const height = 24;
  ctx.beginPath();
  ctx.roundRect(bx - width / 2, by - height / 2, width, height, 18);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `bold 18px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Initial", bx, by);
}

export async function makeGameReplay(game: Cactpot): Promise<Canvas> {
  const { board, initialReveal, reveals, lineChoice } = game.getSummary();

  const emptyBoard = await image("emptyBoard2");
  const canvas = createCanvas(emptyBoard.width, emptyBoard.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("error getting canvas");
  }
  ctx.drawImage(emptyBoard, 0, 0);

  lines[lineChoice!].forEach(([x, y]) => highlightTile(ctx, x, y));
  for (let i = 0; i < board.length; i++) {
    const row = board[i];
    for (let j = 0; j < row.length; j++) {
      const tile = row[j];
      const tilePosition = coordsToPosition(i, j);
      await drawTileOnBoard(
        ctx,
        tile as 1,
        tilePosition,
        // Board.positionsFromBoardLine(lineChoice!).includes(tilePosition),
      );
    }
  }
  [initialReveal, ...reveals].forEach((pos) => outlineTile(ctx, pos));
  // drawLine(ctx, ...reveals); // try without lines for now
  reveals.forEach((pos, i) => drawBadge(ctx, i + 1, pos));
  drawInitialRevealBadge(ctx, initialReveal);

  return canvas;
}
