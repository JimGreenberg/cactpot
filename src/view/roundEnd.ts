import { Summary } from "../cactpot";
import { Board } from "../board";
import { TilePosition } from "../constants";
import { wrap, getScoreBlock, boardLineText, tileChar } from "./util";
import * as S from "./slack";

interface SummaryWithUser extends Summary {
  name: string;
  image: string;
}

export function roundEndView(games: SummaryWithUser[]): any[] {
  const blocks = [
    S.Header(S.PlainText("Scores")),
    ...getScoreBlocks(games),
    S.Context(
      S.Markdown(
        getScoreBlock("The best score on this board was", games[0].bestScore)
      )
    ),
    S.Divider(),
    S.Section(S.Markdown("Watch a replay"), {
      accessory: S.StaticSelect({
        placeholder: S.PlainText("Select a player"),
        options: games.map(getPlayerOption),
        action_id: "send-replay-message",
      }),
    }),
    S.Context(S.PlainText(`Round ID: ${games[0].roundId}`)),
  ];
  return blocks;
}

function renderGame({
  board,
  revealValues,
  lineChoice,
  gameId,
  name,
  image,
}: SummaryWithUser) {
  let tilePosition = 0;
  return [
    S.Context(
      S.Image({
        image_url: image,
        alt_text: name,
      }),
      S.PlainText(name),
      S.PlainText(
        `Revealed ${revealValues[0]}, ${revealValues[1]} and ${
          revealValues[2]
        }, then chose the ${boardLineText(lineChoice!)}`
      ),
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

              return wrap(
                selectedTile ? wrap(wrap(char, "*"), "_") : char,
                " "
              );
            })
            .join(" ")
        )
      )
    ),
    S.Divider(),
  ];
}

function getScoreBlocks(
  games: { score: number; name: string; image: string }[]
) {
  const scoreMap: Record<number, { image: string; name: string }[]> = {};
  games.forEach(({ score, name, image }) => {
    if (!(score in scoreMap)) {
      scoreMap[score] = [];
    }
    scoreMap[score].push({ name, image });
  });
  const placementEmojis = [
    ":first_place_medal:",
    ":second_place_medal:",
    ":third_place_medal:",
    ":dingus:",
  ];
  return Object.entries(scoreMap)
    .sort(([scoreA], [scoreB]) => parseInt(scoreB) - parseInt(scoreA))
    .map(([score, users], i) =>
      S.Context(
        S.Markdown(`${placementEmojis[i]} ${wrap(score, "*")}`),
        ...users.map(({ name, image }) =>
          S.Image({
            image_url: image,
            alt_text: name,
          })
        )
      )
    );
}

function getPlayerOption({
  gameId,
  name,
  image,
}: {
  gameId: string;
  name: string;
  image: string;
}) {
  const value = JSON.stringify({ gameId, name, image });
  return S.Option({ value, text: name });
}
