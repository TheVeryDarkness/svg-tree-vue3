import type { Ref } from "vue";

export interface ColorOptions {
  /**
   * Stroke color of node borders and links.
   */
  borderColor: string;
  /**
   * Fill color of nodes.
   */
  backgroundColor: string;
  /**
   * Fill color of node shadows.
   */
  shadowColor: string;
  /**
   * Fill color of texts.
   *
   * May be overriden by {@link Data}.
   */
  textColor: string;
  /**
   * Font weight of texts.
   */
  textWeight: number;
  /**
   * Fill color of texts when hovering.
   */
  textHoverColor: string;
  /**
   * Font weight of texts when hovering.
   */
  textHoverWeight: number;
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
export interface Options {
  color: ColorOptions;
  layout: LayoutOptions;
}

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
  borderColor: "gray",
  backgroundColor: "white",
  shadowColor: "darkgray",
  textColor: "black",
  textWeight: 400,
  textHoverColor: "darkcyan",
  textHoverWeight: 700,
};
export const defaultDarkColorOptions: ColorOptions = {
  borderColor: "lightgray",
  backgroundColor: "darkgray",
  shadowColor: "black",
  textColor: "white",
  textWeight: 400,
  textHoverColor: "cyan",
  textHoverWeight: 700,
};
export const defaultOptions: Options = {
  color: defaultLightColorOptions,
  layout: defaultLayoutOptions,
};

export interface Data<Child extends Data<Child>> {
  path?: string | number | undefined;
  name: string;
  color?: string;
  backgroundColor?: string;
  children: Child[];
}
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
}
