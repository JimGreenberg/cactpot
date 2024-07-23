import { Summary } from "../cactpot";
import { Board } from "../board";
import { TilePosition } from "../constants";
import {
  wrap,
  code,
  bold,
  italic,
  getScoreBlock,
  boardLineText,
  tileChar,
} from "./util";
import * as S from "./slack";
import type { Avatar } from "../types";

interface SummaryWithUser extends Summary, Avatar {}

interface Streak extends Avatar {
  fieldName: string;
  count: number;
}

export function roundEndView(
  games: SummaryWithUser[],
  streaks: Streak[]
): any[] {
  const optimalUsers: any[] = games
    .filter(({ didPlayOptimally }) => didPlayOptimally)
    .map(({ name, image }) =>
      S.Image({
        image_url: image,
        alt_text: name,
      })
    );
  let mostFunHad = games[0],
    mostFunScore = -100;
  games.forEach((game) => {
    const newFun = Math.floor(Math.random() * 101);
    if (newFun > mostFunScore) {
      mostFunHad = game;
      mostFunScore = newFun;
    }
  });
  if (!optimalUsers.length) optimalUsers.push(S.Markdown(":dingus:"));

  const blocks = [
    S.Header(S.PlainText("Scores")),
    ...getScoreBlocks(games),
    S.Context(
      S.Markdown(
        getScoreBlock("The best score on this board was", games[0].bestScore)
      )
    ),
    S.Context(S.Markdown("Played optimally: "), ...(optimalUsers as [any])),
    S.Context(
      S.Image({
        image_url: mostFunHad.image,
        alt_text: mostFunHad.name,
      }),
      S.Markdown(` ${mostFunHad.name} had the most fun (*${mostFunScore}%*)`)
    ),
    ...streaks.map((streak) =>
      S.Context(
        S.Markdown(":fire::fire::fire:"),
        S.Image({
          image_url: streak.image,
          alt_text: streak.name,
        }),
        S.Markdown(`is on a ${streak.fieldName} streak of ${streak.count}`),
        S.Markdown(":fire::fire::fire:")
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
              const char = code(wrap(tileChar(tile), " "));

              return wrap(selectedTile ? italic(bold(char)) : char, " ");
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
    .map(([score, users]) => [parseInt(score), users] as const)
    .sort(([scoreA], [scoreB]) => scoreB - scoreA)
    .map(([score, users], i) =>
      S.Context(
        S.Markdown(`${placementEmojis[i]} ${bold(score.toLocaleString())}`),
        ...(users.map(({ name, image }) =>
          S.Image({
            image_url: image,
            alt_text: name,
          })
        ) as [any])
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
