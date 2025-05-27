import type { Ref } from "vue";

export interface ColorOptions {
  /**
   * Font weight of texts.
   */
  textWeight: number;
  /**
   * Font weight of texts when hovering.
   */
  textHoverWeight: number;
  /**
   * Font weight of texts when active.
   */
  textActiveWeight: number;
}
export interface LayoutOptions {
  indentX: number;
  indentY: number;
  marginY: number;
  marginX: number;
  paddingY: number;
  paddingX: number;
  radius: number;
}
export interface FontOptions {
  fontFamily: string;
  fontSize: number;
}
export interface Options {
  color: ColorOptions;
  layout: LayoutOptions;
  font: FontOptions;
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type PartialOptions = DeepPartial<Options> | undefined;

export const defaultLayoutOptions: LayoutOptions = {
  indentX: 24,
  indentY: 16,
  marginY: 8,
  marginX: 16,
  paddingY: 6,
  paddingX: 10,
  radius: 4,
};
export const defaultLightColorOptions: ColorOptions = {
  textWeight: 400,
  textHoverWeight: 700,
  textActiveWeight: 1000,
};
export const defaultDarkColorOptions: ColorOptions = {
  textWeight: 400,
  textHoverWeight: 700,
  textActiveWeight: 1000,
};
export const defaultFontOptions: FontOptions = {
  fontFamily: "JetBrains Mono",
  fontSize: 14,
};
export const defaultOptions: Options = {
  color: defaultLightColorOptions,
  layout: defaultLayoutOptions,
  font: defaultFontOptions,
};

export function mergeOptions(options: PartialOptions | undefined): Options {
  return {
    color: { ...defaultLightColorOptions, ...options?.color },
    layout: { ...defaultLayoutOptions, ...options?.layout },
    font: { ...defaultFontOptions, ...options?.font },
  };
}

export function createContext(canvas: OffscreenCanvas) {
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textRendering = "optimizeLegibility";
  return ctx;
}

export type Data<Child extends Data<Child, Key>, Key extends string | number | symbol = "path"> = {
  name: string;
  color?: string;
  backgroundColor?: string;
  children: Child[];
  extensible?: boolean;
} & {
  [key in Key]?: string | number | undefined;
};
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface TreeNodeSize {
  bounding: { width: number; height: number };
  name: Rectangle;
}
export interface State {
  vertical: Ref<boolean>;
  collapsed: Ref<boolean>;
}

export interface TreeEvent<T extends Data<T>, E extends Event> {
  node: T;
  state: State;
  event: E;
  scrollIntoView(): void;
}

export interface ExternalState {
  active: Ref<number | string | undefined>;
  hover: Ref<number | string | undefined>;
}
