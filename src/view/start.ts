import { User } from "./util";
import * as S from "./slack";

export function startView(roundId: string, currentPlayers: User[]) {
  const value = JSON.stringify({
    roundId,
  });

  return [
    S.Header(S.PlainText("Would you like to play cactpot? <!channel>")),
    S.Actions(
      S.Button({ value, action_id: "join", text: "Join" }),
      S.Button({
        value,
        action_id: "start-early",
        text: "Start Early",
        style: "danger",
        confirm: {
          title: S.PlainText("Start early?"),
          text: S.PlainText(
            `Play with only ${currentPlayers.length} players? This will not affect the leaderboards`
          ),
          confirm: S.PlainText("Play Anyway"),
          deny: S.PlainText("Cancel"),
        },
      })
    ),
    S.Context(
      ...currentPlayers.map(({ profile: { image_24, display_name } }) =>
        S.Image({
          image_url: image_24,
          alt_text: display_name,
        })
      )
    ),
    // S.Context(S.PlainText(`Round ID: ${roundId}`)),
  ];
}
