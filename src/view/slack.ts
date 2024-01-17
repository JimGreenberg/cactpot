interface Text {
  type: "plain_text" | "mrkdwn";
  text: string;
}

export function Actions(...elements: any[]) {
  return { type: "actions", elements };
}
export function ConfirmActions(...elements: any[]) {
  return { type: "actions", elements };
}

export function Button({ value, action_id, text, style, confirm }: any) {
  return {
    type: "button",
    value,
    action_id,
    style,
    confirm,
    text: {
      text,
      type: "plain_text",
      emoji: true,
    },
  };
}

export function Context(...elements: (Text | ReturnType<typeof Image>)[]) {
  return { type: "context", elements };
}

export function Divider() {
  return { type: "divider" };
}

export function Header(text: Text) {
  return { type: "header", text };
}

export function Image({ image_url, alt_text }: Record<string, string>) {
  return { type: "image", image_url, alt_text };
}

export function Markdown(text: string): Text {
  return { type: "mrkdwn", text };
}

export function PlainText(text: string): Text {
  return { type: "plain_text", text };
}

export function Section(text: Text) {
  return { type: "section", text };
}
