import fs from "fs";
import path from "path";
import { Cactpot } from "../cactpot";
import { Board } from "../board";
import { TilePosition } from "../constants";
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

// based on emptyBoard.png
const tiles = {
  [TilePosition.TOP_LEFT]: [56.5, 28.5],
  [TilePosition.TOP_MIDDLE]: [184.5, 28.5],
  [TilePosition.TOP_RIGHT]: [312.5, 28.5],
  [TilePosition.MIDDLE_LEFT]: [56.5, 116.5],
  [TilePosition.CENTER]: [184.5, 116.5],
  [TilePosition.MIDDLE_RIGHT]: [312.5, 116.5],
  [TilePosition.BOTTOM_LEFT]: [56.5, 204.5],
  [TilePosition.BOTTOM_MIDDLE]: [184.5, 204.5],
  [TilePosition.BOTTOM_RIGHT]: [312.5, 204.5],
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
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(val), x, y);
}

function encircleNumber(ctx: CanvasCtx, position: TilePosition, color = "red") {
  const [x, y] = tiles[position];
  const size = 36;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, 8);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

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
  const bx = x + 18;
  const by = y - 18;
  ctx.beginPath();
  ctx.arc(bx, by, 8, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(val), bx, by);
}

export async function makeGameReplay(game: Cactpot): Promise<Canvas> {
  const { board, initialReveal, reveals, lineChoice } = game.getSummary();

  const emptyBoard = await image("emptyBoard");
  const canvas = createCanvas(emptyBoard.width, emptyBoard.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("error getting canvas");
  }
  ctx.drawImage(emptyBoard, 0, 0);

  for (let i = 0; i < board.length; i++) {
    const row = board[i];
    for (let j = 0; j < row.length; j++) {
      const tile = row[j];
      const tilePosition = coordsToPosition(i, j);
      await drawTileOnBoard(
        ctx,
        tile as 1,
        tilePosition,
        Board.positionsFromBoardLine(lineChoice!).includes(tilePosition),
      );
    }
  }
  [initialReveal, ...reveals].forEach((pos) => encircleNumber(ctx, pos));
  // drawLine(ctx, ...reveals); // try without lines for now
  reveals.forEach((pos, i) => drawBadge(ctx, i + 1, pos));

  return canvas;
}
