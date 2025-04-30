import { Summary } from "../cactpot";
import { Board } from "../board";
import { TilePosition } from "../constants";
import { tileChar, wrap, boardLineText } from "./util";
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
