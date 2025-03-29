import * as S from "./slack";

export function gameHasBegun(message: string, cta: string = "Play") {
  return [
    S.Section(S.Markdown(message), {
      accessory: S.Button({ text: S.PlainText(cta), action_id: "unfinished" }),
    }),
  ];
}
