import * as S from "./slack";

interface HonestyInfo {
  name: string;
  image: string;
  countGames: number;
  numOptimalChoices: number;
}

export function checkHonestyView(users: HonestyInfo[]) {
  return [
    S.Header(S.PlainText("Optimal Play* Dashboard")),
    S.Divider(),
    ...users.map(checkHonestyUserView).flat(1),
  ];
}

function checkHonestyUserView({
  name,
  image,
  numOptimalChoices,
  countGames,
}: HonestyInfo) {
  return [
    S.Context(S.Image({ image_url: image, alt_text: name }), S.PlainText(name)),
    S.Context(
      S.Markdown(
        `Played optimally: *${numOptimalChoices}* out of *${countGames}* games`
      )
    ),
    S.Divider(),
  ];
}
