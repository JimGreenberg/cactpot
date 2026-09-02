import { Summary } from "../cactpot";
import { Board } from "../board";
import { BoardLine, TilePosition } from "../constants";
import { bold, code, codeBlock, boardLineText } from "./util";
import * as S from "./slack";
import type { Avatar } from "../types";

/** marks the tile the player was given for free */
const INITIAL_REVEAL_MARKER = "°";
/** marks the three tiles the player chose, in the order they chose them */
const REVEAL_MARKERS = ["¹", "²", "³"];

/**
 * markers for the scored line, named after the BoardLine each one points at.
 * BoardLine.DIAGONAL runs bottom left to top right (see boardLineText, which
 * calls it the Upwards Diagonal), so its arrow points up and to the right.
 */
const ROW_MARKER = "►";
const COL_MARKER = "▼";
const DIAGONAL_MARKER = "↗";
const ANTIDIAGONAL_MARKER = "↘";

const GUTTER = 2;
const TOP = "┌────┬────┬────┐";
const DIVIDER = "├────┼────┼────┤";
const BOTTOM = "└────┴────┴────┘";

const COL_LINES = [
  BoardLine.LEFT_COL,
  BoardLine.MIDDLE_COL,
  BoardLine.RIGHT_COL,
];
const ROW_LINES = [
  BoardLine.TOP_ROW,
  BoardLine.MIDDLE_ROW,
  BoardLine.BOTTOM_ROW,
];

/** position of a tile within seedString */
function seedIndex(position: TilePosition): number {
  return Object.values(TilePosition).indexOf(position);
}

/** one marker per tile, in seedString order */
function revealMarkers({
  initialReveal,
  reveals,
}: Pick<Summary, "initialReveal" | "reveals">): string[] {
  const markers = new Array(9).fill(" ");
  markers[seedIndex(initialReveal)] = INITIAL_REVEAL_MARKER;
  reveals
    .slice(0, REVEAL_MARKERS.length)
    .forEach((pos, i) => (markers[seedIndex(pos)] = REVEAL_MARKERS[i]));
  return markers;
}

/**
 * the line marker that sits above the grid. columns point down at their
 * column; the two diagonals sit outside the grid at the end they run toward,
 * so they can never be mistaken for a column marker.
 */
function lineMarkerRow(lineChoice?: BoardLine): string | undefined {
  if (!lineChoice) return;
  if (COL_LINES.includes(lineChoice)) {
    const col = COL_LINES.indexOf(lineChoice);
    return " ".repeat(GUTTER + 2 + col * 5) + COL_MARKER;
  }
  if (lineChoice === BoardLine.DIAGONAL) {
    return " ".repeat(GUTTER + TOP.length) + DIAGONAL_MARKER;
  }
  if (lineChoice === BoardLine.ANTIDIAGONAL) return ANTIDIAGONAL_MARKER;
}

/** the grid itself, with a row marker in the left gutter when a row was scored */
function gridRows(
  seedString: string,
  markers: string[],
  lineChoice?: BoardLine
): string[] {
  const pad = " ".repeat(GUTTER);
  const rows = [pad + TOP];
  for (let row = 0; row < 3; row++) {
    const gutter = lineChoice === ROW_LINES[row] ? `${ROW_MARKER} ` : pad;
    const cells = [0, 1, 2]
      .map((col) => {
        const i = row * 3 + col;
        // a seed is always nine tiles; fall back rather than print
        // "undefined" into a cell and break every column below it
        return ` ${seedString[i] ?? " "}${markers[i]} `;
      })
      .join("│");
    rows.push(`${gutter}│${cells}│`);
    if (row < 2) rows.push(pad + DIVIDER);
  }
  rows.push(pad + BOTTOM);
  return rows;
}

/**
 * one fully revealed board carrying the whole game: which tile was free,
 * which three the player chose and in what order, and which line they scored.
 */
export function notationGrid({
  seedString,
  initialReveal,
  reveals,
  lineChoice,
}: Pick<
  Summary,
  "seedString" | "initialReveal" | "reveals" | "lineChoice"
>): string {
  const marker = lineMarkerRow(lineChoice);
  const rows = gridRows(
    seedString,
    revealMarkers({ initialReveal, reveals }),
    lineChoice
  );
  return (marker ? [marker, ...rows] : rows).join("\n");
}

/**
 * the scored line's values left to right, top to bottom. sorting is required
 * because positionsFromBoardLine returns DIAGONAL bottom up.
 */
function lineValuesInReadingOrder(
  seedString: string,
  line: BoardLine
): number[] {
  return Board.positionsFromBoardLine(line)
    .map(seedIndex)
    .sort((a, b) => a - b)
    .map((i) => Number(seedString[i]));
}

export function notationView({
  name,
  image,
  ...summary
}: Summary & Avatar): any[] {
  const { seedString, lineChoice, score, gameId } = summary;

  const blocks: any[] = [
    S.Section(S.PlainText("Notation:")),
    S.Context(
      S.Image({
        image_url: image,
        alt_text: name,
      }),
      S.PlainText(name),
      S.PlainText(`Game ID: ${gameId}`)
    ),
    S.Section(S.Markdown(codeBlock(notationGrid(summary)))),
  ];

  if (lineChoice) {
    const values = lineValuesInReadingOrder(seedString, lineChoice);
    const sum = values.reduce((a, c) => a + c, 0);
    blocks.push(
      S.Section(
        S.Markdown(
          `${name} selected ${bold(boardLineText(lineChoice))} ` +
            `${code(`${values.join("+")} = ${sum}`)} for ${bold(
              score.toLocaleString()
            )}`
        )
      )
    );
  } else {
    blocks.push(S.Context(S.PlainText("This game was never finished")));
  }

  blocks.push(
    S.Context(
      S.Markdown(
        `${code(INITIAL_REVEAL_MARKER)} first look · ` +
          `${REVEAL_MARKERS.map(code).join("")} picks in order`
      )
    )
  );
  blocks.push(S.Actions(S.Button({ text: "Dismiss", action_id: "delete" })));

  return blocks;
}
