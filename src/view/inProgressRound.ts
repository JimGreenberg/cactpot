import { Board } from "../board";
import { Turn } from "../constants";
import { wrap, turnText } from "./util";
import * as S from "./slack";

interface UserWithTurn {
  name: string;
  image: string;
  turn: Turn;
}

export function inProgressRound(users: UserWithTurn[]) {
  const blocks = [
    S.Context(
      ...users
        .map(({ name, image, turn }) => [
          S.Image({ image_url: image, alt_text: name }),
          S.PlainText(turnText(turn)),
        ])
        .flat()
    ),
    ...getScoreInfoBlocks(),
  ];
  return blocks;
}

function getScoreInfoBlocks(rows = 4) {
  const blocks = new Array(rows).fill(0).map(() => S.Context());
  const scoreBlocks = Object.entries(Board.scores).map(([sum, points]) =>
    getScoreInfoBlock(sum, points)
  );
  while (scoreBlocks.length) {
    for (let i = 0; i < rows; i++) {
      const scoreBlock = scoreBlocks.shift();
      scoreBlock && blocks[i].elements.push(scoreBlock);
    }
  }
  return [S.Context(S.PlainText("Scores")), ...blocks];
}

function getScoreInfoBlock(label: string, score: number) {
  const totalLength = 8;
  const scoreFmt = score.toLocaleString();
  const spacerLength = totalLength - scoreFmt.length - label.length;

  const text =
    wrap(wrap(label, "`"), "*") +
    wrap(" ".repeat(spacerLength) + score.toLocaleString(), "`");
  return S.Markdown(text);
}
