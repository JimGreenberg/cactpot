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

interface FunScore extends Avatar {
  fun: number;
}

/** Unicode superscript digits 0-9 for raw fun scores (not percent). */
const SUPERSCRIPT_DIGITS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

export function toSuperscript(n: number): string {
  return String(Math.floor(n))
    .split("")
    .map((d) => SUPERSCRIPT_DIGITS[Number(d)] ?? d)
    .join("");
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
  if (!optimalUsers.length) optimalUsers.push(S.Markdown(":dingus:"));

  const funScores: FunScore[] = games.map((game) => ({
    ...game,
    fun: Math.floor(Math.random() * 101),
  }));
  // First max wins ties (stable, simple).
  let mostFunHad = funScores[0]!;
  for (const entry of funScores) {
    if (entry.fun > mostFunHad.fun) mostFunHad = entry;
  }

  const blocks = [
    S.Header(S.PlainText("Scores")),
    ...getScoreBlocks(games),
    S.Context(
      S.Markdown(
        getScoreBlock("The best score on this board was", games[0].bestScore) +
          ` (${games[0].bestScoreLines.map(boardLineText).join(", ")})`
      )
    ),
    S.Context(S.Markdown("Played optimally: "), ...(optimalUsers as [any])),
    ...hadFunContexts(funScores),
    S.Context(
      S.Image({
        image_url: mostFunHad.image,
        alt_text: mostFunHad.name,
      }),
      S.Markdown(
        ` ${mostFunHad.name} had the most fun!`
      )
    ),
    ...streaks.map((streak) =>
      S.Context(
        S.Markdown(":fire:"),
        S.Image({
          image_url: streak.image,
          alt_text: streak.name,
        }),
        S.Markdown(
          ` ${streak.name} is on a ${streak.fieldName} streak of ${streak.count}`
        ),
        S.Markdown(":fire:")
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
    S.Section(S.Markdown("See the notation"), {
      accessory: S.StaticSelect({
        placeholder: S.PlainText("Select a player"),
        options: games.map(getPlayerOption),
        action_id: "send-notation-message",
      }),
    }),
    S.Context(S.PlainText(`Round ID: ${games[0].roundId}`)),
  ];
  return blocks;
}

/**
 * "Had fun:" like "Played optimally:", but every player gets a portrait plus
 * a raw fun score in superscript. Slack Context blocks max out at 10 elements,
 * so large rounds are split across multiple Contexts.
 */
function hadFunContexts(funScores: FunScore[]): any[] {
  // label + (image + markdown) per player; keep first block under 10 elements
  const firstCapacity = 4; // 1 label + 4*(img+md) = 9
  const laterCapacity = 5; // 5*(img+md) = 10
  const contexts: any[] = [];
  let i = 0;
  let first = true;
  while (i < funScores.length) {
    const capacity = first ? firstCapacity : laterCapacity;
    const slice = funScores.slice(i, i + capacity);
    const elements: any[] = [];
    if (first) elements.push(S.Markdown("Had fun: "));
    for (const { name, image, fun } of slice) {
      elements.push(
        S.Image({
          image_url: image,
          alt_text: name,
        })
      );
      elements.push(S.Markdown(toSuperscript(fun)));
    }
    contexts.push(S.Context(...(elements as [any])));
    i += slice.length;
    first = false;
  }
  return contexts;
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
        S.Markdown(
          `${
            placementEmojis[i] || placementEmojis[placementEmojis.length - 1]
          } ${bold(score.toLocaleString())}`
        ),
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
  userId,
}: {
  gameId: string;
  name: string;
  userId: string;
}) {
  const value = JSON.stringify({ gameId, userId });
  return S.Option({ value, text: name });
}
