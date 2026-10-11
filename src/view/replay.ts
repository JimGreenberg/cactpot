import { Summary } from "../cactpot";
import { Board } from "../board";
import { BoardLine, TilePosition } from "../constants";
import { tileChar, wrap, bold, code, boardLineText } from "./util";
import * as S from "./slack";

export function beginReplayButton({
  name,
  image,
  gameId,
  userId,
}: {
  name: string;
  image: string;
  gameId: string;
  userId: string;
}) {
  const value = JSON.stringify({ gameId, userId, name });
  return [
    S.Section(S.PlainText("Now watching:")),
    S.Context(
      S.Image({
        image_url: image,
        alt_text: name,
      }),
      S.PlainText(name),
      S.PlainText(`Game ID: ${gameId}`)
    ),
    S.Actions(
      S.Button({ value, action_id: "begin-replay", text: "Begin Replay" })
    ),
  ];
}

export function replayView({
  board,
  lineChoice,
  name,
  image,
  gameId,
}: Summary & { name: string; image: string }) {
  let tilePosition = 0;
  const blocks: any[] = [
    S.Section(S.PlainText("Now watching:")),
    S.Context(
      S.Image({
        image_url: image,
        alt_text: name,
      }),
      S.PlainText(name),
      S.PlainText(`Game ID: ${gameId}`)
    ),
    ...board.map((row) =>
      S.Section(
        S.Markdown(
          row
            .map((tile) => {
              const value = Object.values(TilePosition)[tilePosition++];
              const selectedTile =
                lineChoice &&
                Board.positionsFromBoardLine(lineChoice).includes(value);
              const char = wrap(wrap(tileChar(tile), " "), "`");

              return wrap(selectedTile ? wrap(char, "*") : char, " ");
            })
            .join(" ")
        )
      )
    ),
  ];
  if (lineChoice) {
    blocks.push(
      S.Section(S.Markdown(`${name} selected: *${boardLineText(lineChoice)}*`))
    );
    blocks.push(S.Actions(S.Button({ text: "Dismiss", action_id: "delete" })));
  }
  return blocks;
}

export function notationView({
  seedString,
  initialReveal,
  reveals,
  lineChoice,
  score,
  name,
  image,
  gameId,
}: Summary & { name: string; image: string }) {
  const tiles = Object.values(TilePosition);
  const cells = tiles.map(
    (pos, i) =>
      ` ${seedString[i]}${pos === initialReveal ? "°" : ("¹²³"[reveals.indexOf(pos)] ?? " ")} `,
  );
  // BoardLine order is 3 rows, 3 columns, DIAGONAL (bottom left up), ANTIDIAGONAL
  const line = Object.values(BoardLine).indexOf(lineChoice!);
  const rows = [0, 1, 2].map(
    (r) =>
      `${r === line ? "►" : " "} │${cells.slice(r * 3, r * 3 + 3).join("│")}│`,
  );
  const marker =
    line < 3
      ? ""
      : line < 6
        ? "▼".padStart(5 * line - 10)
        : line === 6
          ? "↗".padStart(19)
          : "↘";
  const grid = [
    marker,
    "  ┌────┬────┬────┐",
    rows.join("\n  ├────┼────┼────┤\n"),
    "  └────┴────┴────┘",
  ];
  // sorted because positionsFromBoardLine returns DIAGONAL bottom up
  const values = lineChoice
    ? Board.positionsFromBoardLine(lineChoice)
        .map((pos) => tiles.indexOf(pos))
        .sort((a, b) => a - b)
        .map((i) => Number(seedString[i]))
    : [];
  return [
    S.Section(S.PlainText("Notation:")),
    S.Context(
      S.Image({ image_url: image, alt_text: name }),
      S.PlainText(name),
      S.PlainText(`Game ID: ${gameId}`),
    ),
    S.Section(
      S.Markdown(wrap(`\n${grid.filter(Boolean).join("\n")}\n`, "```")),
    ),
    lineChoice
      ? S.Section(
          S.Markdown(
            `${name} selected ${bold(boardLineText(lineChoice))} ${code(`${values.join("+")} = ${values.reduce((a, c) => a + c, 0)}`)} for ${bold(score.toLocaleString())}`,
          ),
        )
      : S.Context(S.PlainText("This game was never finished")),
    S.Context(
      S.Markdown(`${code("°")} first look · ${code("¹²³")} picks in order`),
    ),
    S.Actions(S.Button({ text: "Dismiss", action_id: "delete" })),
  ];
}
