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

type ContextElement = Text | ReturnType<typeof Image>;
/**
 *
 * Context may only have 10 elements
 * use tuple type overload signatures to enforce
 */
export function Context(
  ...elements: [
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement
  ]
): any;
export function Context(
  ...elements: [
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement
  ]
): any;
export function Context(
  ...elements: [
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement
  ]
): any;
export function Context(
  ...elements: [
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement
  ]
): any;
export function Context(
  ...elements: [
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement
  ]
): any;
export function Context(
  ...elements: [
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement,
    ContextElement
  ]
): any;
export function Context(
  ...elements: [ContextElement, ContextElement, ContextElement, ContextElement]
): any;
export function Context(
  ...elements: [ContextElement, ContextElement, ContextElement]
): any;
export function Context(...elements: [ContextElement, ContextElement]): any;
export function Context(...elements: [ContextElement]): any;
export function Context(...elements: []): any;
export function Context(...elements: never): any {
  return { type: "context", elements };
}

export function Divider() {
  return { type: "divider" };
}

export function Header(text: Text) {
  return { type: "header", text };
}

export function Image({
  image_url,
  alt_text,
}: {
  image_url: string;
  alt_text: string;
}) {
  return { type: "image", image_url, alt_text };
}

export function Markdown(text: string): Text {
  return { type: "mrkdwn", text };
}

export function Option({ value, text }: { value: string; text: string }) {
  return {
    text: PlainText(text),
    value,
  };
}

export function PlainText(text: string): Text {
  return { type: "plain_text", text, emoji: true } as Text;
}

export function Section(text: Text, { accessory }: { accessory?: any } = {}) {
  if (accessory) return { type: "section", text, accessory };
  return { type: "section", text };
}

export function StaticSelect({
  placeholder,
  options,
  action_id,
}: {
  placeholder?: Text;
  options: ReturnType<typeof Option>[];
  action_id: string;
}) {
  return {
    type: "static_select",
    placeholder,
    options,
    action_id,
  };
}
