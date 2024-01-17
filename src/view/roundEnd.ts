import { Summary } from "../cactpot";
import { Board } from "../board";
import { TilePosition } from "../constants";
import { renderTile, wrap, getScoreBlock, boardLineText } from "./util";
import * as S from "./slack";

interface SummaryWithUser extends Summary {
  profile: {
    image_24: string;
    display_name: string;
  };
}

export function roundEndView(games: SummaryWithUser[]) {
  return [
    S.Header(S.PlainText("Results")),
    ...games.map(renderGame),
    S.Section(
      S.Markdown(
        getScoreBlock("The best score on this board was", games[0].bestScore)
      )
    ),
    S.Context(S.PlainText(`Round ID: ${games[0].roundId}`)),
  ];
}

function renderGame({
  board,
  reveals,
  score,
  lineChoice,
  gameId,
  profile: { display_name, image_24 },
}: SummaryWithUser) {
  let tilePosition = 0;
  return [
    S.Context(
      S.Image({
        image_url: image_24,
        alt_text: display_name,
      }),
      S.PlainText(display_name)
    ),
    ...board.map((row) => {
      S.Section(
        S.Markdown(
          row
            .map((tile) => {
              const value = Object.values(TilePosition)[tilePosition++];
              const selectedTile =
                lineChoice &&
                Board.positionsFromBoardLine(lineChoice).includes(value);
              const char = wrap(wrap(renderTile(tile, false), " "), "`");

              return wrap(selectedTile ? wrap(char, "*") : char, " ");
            })
            .join(" ")
        )
      );
    }),

    S.Context(
      S.PlainText(
        `Revealed ${reveals[0]}, ${reveals[1]} and ${
          reveals[2]
        }, then chose the ${boardLineText(lineChoice!)}`
      )
    ),

    S.Section(S.Markdown(getScoreBlock("Score", score))),

    S.Context(S.PlainText(`Game ID: ${gameId}`)),

    S.Divider(),
  ];
}
