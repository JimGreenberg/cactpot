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
  const blocks: any[] = [S.Header(S.PlainText("Results"))];
  games.forEach((game) => blocks.push(...renderGame(game)));

  blocks.push(
    S.Section(
      S.Markdown(
        getScoreBlock("The best score on this board was", games[0].bestScore)
      )
    )
  );

  blocks.push(S.Context(S.PlainText(`Round ID: ${games[0].roundId}`)));

  return blocks;
}

function renderGame({
  board,
  reveals,
  score,
  lineChoice,
  gameId,
  profile: { display_name, image_24 },
}: SummaryWithUser) {
  const blocks: any[] = [
    S.Context(
      S.Image({
        image_url: image_24,
        alt_text: display_name,
      }),
      S.PlainText(display_name)
    ),
  ];

  let tilePosition = 0;
  board.forEach((row) => {
    blocks.push(
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
      )
    );
  });

  blocks.push(
    S.Context(
      S.PlainText(
        `Revealed ${reveals[0]}, ${reveals[1]} and ${
          reveals[2]
        }, then chose the ${boardLineText(lineChoice!)}`
      )
    )
  );

  blocks.push(S.Section(S.Markdown(getScoreBlock("Score", score))));

  blocks.push(S.Context(S.PlainText(`Game ID: ${gameId}`)));

  blocks.push(S.Divider());

  return blocks;
}
