import {
  createCanvas,
  loadImage,
  CanvasRenderingContext2D as CanvasCtx,
  Canvas,
} from "canvas";
import { Cactpot } from "../cactpot";
import { makeGameReplay } from "../replay/game";

const FONT_FAMILY = "Lato, Ubuntu, sans-serif";
const NAME_FONT_SIZE = 28;
const NAME_PADDING = 8;
const NAME_TOTAL_HEIGHT = NAME_FONT_SIZE + NAME_PADDING * 2;

const MARGIN_BETWEEN_GAMES = 32;

function drawName(ctx: CanvasCtx, name: string, x: number, y: number) {
  ctx.fillStyle = "black";
  ctx.strokeStyle = "white";
  ctx.font = `${NAME_FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.strokeText(name, x + NAME_PADDING, y + NAME_PADDING);
  ctx.fillText(name, x + NAME_PADDING, y + NAME_PADDING);
}

export async function makeRoundReplay(gameWithNameTuples: [Cactpot, string][]) {
  const canvases: [Canvas, string][] = [];
  for (const [game, name] of gameWithNameTuples) {
    const canvas = await makeGameReplay(game);
    canvases.push([canvas, name]);
    await new Promise(setImmediate); // timeout hack
  }
  const gameCanvasWidth = canvases[0][0].width;
  const gameCanvasHeight = canvases[0][0].height;
  const canvas = createCanvas(
    gameCanvasWidth * 2 + MARGIN_BETWEEN_GAMES,
    (gameCanvasHeight + NAME_TOTAL_HEIGHT) * 2 + MARGIN_BETWEEN_GAMES,
  );
  const origins = [
    [0, 0],
    [gameCanvasWidth + MARGIN_BETWEEN_GAMES, 0],
    [0, gameCanvasHeight + NAME_TOTAL_HEIGHT + MARGIN_BETWEEN_GAMES],
    [
      gameCanvasWidth + MARGIN_BETWEEN_GAMES,
      gameCanvasHeight + NAME_TOTAL_HEIGHT + MARGIN_BETWEEN_GAMES,
    ],
  ];
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("error getting canvas");
  }
  ctx.fillStyle = "#f6f6f6";
  ctx.fillRect(
    0,
    0,
    2 * gameCanvasWidth + MARGIN_BETWEEN_GAMES,
    2 * gameCanvasHeight + MARGIN_BETWEEN_GAMES,
  );

  origins.forEach(([x, y], i) => {
    const [canvas, name] = canvases[i] ?? canvases[0]; // fallback to first (mostly for debug)
    drawName(ctx, name, x, y);
    ctx.drawImage(canvas, x, y + NAME_TOTAL_HEIGHT);
  });

  return canvas;
}
