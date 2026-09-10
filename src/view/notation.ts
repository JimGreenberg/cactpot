import { Summary } from "../cactpot";
import { Board } from "../board";
import { BoardLine, TilePosition } from "../constants";
import { bold, code, codeBlock, boardLineText } from "./util";
import * as S from "./slack";
import type { Avatar } from "../types";

const INITIAL_REVEAL_MARKER = "°";
const REVEAL_MARKERS = ["¹", "²", "³"];

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

function seedIndex(position: TilePosition): number {
  return Object.values(TilePosition).indexOf(position);
}

function revealMarkers(
  initialReveal: TilePosition,
  reveals: TilePosition[]
): string[] {
  const markers = new Array(9).fill(" ");
  markers[seedIndex(initialReveal)] = INITIAL_REVEAL_MARKER;
  reveals
    .slice(0, REVEAL_MARKERS.length)
    .forEach((pos, i) => (markers[seedIndex(pos)] = REVEAL_MARKERS[i]));
  return markers;
}

function lineMarkerRow(lineChoice?: BoardLine): string | undefined {
  if (!lineChoice) return;
  if (COL_LINES.includes(lineChoice)) {
    const col = COL_LINES.indexOf(lineChoice);
    return " ".repeat(GUTTER + 2 + col * 5) + COL_MARKER;
  }
  if (lineChoice === BoardLine.ANTIDIAGONAL) return ANTIDIAGONAL_MARKER;
}

function lineMarkerFooter(lineChoice?: BoardLine): string | undefined {
  if (lineChoice === BoardLine.DIAGONAL) return DIAGONAL_MARKER;
}

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
        return ` ${seedString[i] ?? " "}${markers[i]} `;
      })
      .join("│");
    rows.push(`${gutter}│${cells}│`);
    if (row < 2) rows.push(pad + DIVIDER);
  }
  rows.push(pad + BOTTOM);
  return rows;
}

export function notationGrid(
  seedString: string,
  initialReveal: TilePosition,
  reveals: TilePosition[],
  lineChoice?: BoardLine
): string {
  const header = lineMarkerRow(lineChoice);
  const footer = lineMarkerFooter(lineChoice);
  const rows = gridRows(
    seedString,
    revealMarkers(initialReveal, reveals),
    lineChoice
  );
  return [
    ...(header ? [header] : []),
    ...rows,
    ...(footer ? [footer] : []),
  ].join("\n");
}

/** DIAGONAL positions come bottom-up; sort into reading order */
function lineValuesInReadingOrder(
  seedString: string,
  line: BoardLine
): number[] {
  return Board.positionsFromBoardLine(line)
    .map(seedIndex)
    .sort((a, b) => a - b)
    .map((i) => Number(seedString[i]));
}

export function notationView(summary: Summary, { name, image }: Avatar): any[] {
  const { seedString, initialReveal, reveals, lineChoice, score, gameId } =
    summary;

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
    S.Section(
      S.Markdown(
        codeBlock(
          notationGrid(seedString, initialReveal, reveals, lineChoice)
        )
      )
    ),
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
          `${REVEAL_MARKERS.map(code).join(" ")} picks in order`
      )
    )
  );
  blocks.push(S.Actions(S.Button({ text: "Dismiss", action_id: "delete" })));

  return blocks;
}
