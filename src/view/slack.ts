interface Text {
  type: "plain_text" | "mrkdwn";
  text: string;
}

export function Actions(...elements: any[]) {
  return { type: "actions", elements };
}

export function Button({
  value,
  action_id,
  text,
  style,
}: Record<string, string>) {
  return {
    type: "button",
    value,
    action_id,
    style,
    text: {
      text,
      type: "plain_text",
      emoji: true,
    },
  };
}

export function Confirm({ title, text, confirm, deny }: Record<string, Text>) {
  return {
    confirm: {
      title,
      text,
      confirm,
      deny,
    },
  };
}

export function Context(...elements: any[]) {
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
