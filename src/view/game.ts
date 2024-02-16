import { Board } from "../board";
import { Turn } from "../constants";
import { wrap } from "./util";
import * as S from "./slack";

export function getHeaderCopy(turn: Turn) {
  switch (turn) {
    case Turn.INIT:
      return "Select three slots to uncover";
    case Turn.FIRST:
      return "Select two slots to uncover";
    case Turn.SECOND:
      return "Select one slot to uncover";
    case Turn.THIRD:
      return "Select a line to add up";
    case Turn.FINAL:
      return "Score";
  }
}

export function getScoreInfoBlocks(score: number, rows = 4) {
  const blocks = new Array(rows).fill(0).map(() => S.Context());
  const scoreBlocks = Object.entries(Board.scores).map(([sum, points]) =>
    getScoreInfoBlock([sum, points], score === points)
  );
  while (scoreBlocks.length) {
    for (let i = 0; i < rows; i++) {
      const scoreBlock = scoreBlocks.shift();
      scoreBlock && blocks[i].elements.push(scoreBlock);
    }
  }
  return [S.Context(S.PlainText("Scores")), ...blocks];
}

function getScoreInfoBlock([label, score]: [string, number], selected = false) {
  const totalLength = 8;
  const scoreFmt = score.toLocaleString();
  const spacerLength = totalLength - scoreFmt.length - label.length;

  const text =
    wrap(wrap(label, "`"), "*") +
    wrap(" ".repeat(spacerLength) + score.toLocaleString(), "`");
  // text: `*${label}* | ${score.toLocaleString()}`,
  return S.Markdown(text);
}
