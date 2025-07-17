import type { Ref } from "vue";

export interface TextOptions {
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
/**
 * Layout options for the tree.
 *
 * @member indentX - Horizontal indentation between parent and child nodes.
 * @member indentY - Vertical indentation between nodes.
 * @member marginY - Vertical margin around the tree.
 * @member marginX - Horizontal margin around the tree.
 * @member paddingY - Vertical padding between node text and its bounding box.
 * @member paddingX - Horizontal padding between node text and its bounding box.
 * @member radius - Corner radius of the node's bounding box.
 */
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
export interface ShapeOptions {
  arrow: {
    width: number;
    length: number;
  };
  circle: {
    width: number;
    length: number;
  };
  diamond: {
    width: number;
    length: number;
  };
  triangle: {
    width: number;
    length: number;
  };
}
// export interface ControlOptions {
//   dblclick: number;
// }
export interface Options {
  text: TextOptions;
  layout: LayoutOptions;
  font: FontOptions;
  shape: ShapeOptions;
  // control: ControlOptions;
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type PartialOptions = DeepPartial<Options> | undefined;

export const defaultLayoutOptions: LayoutOptions = {
  indentX: 8,
  indentY: 16,
  marginX: 20,
  marginY: 15,
  paddingX: 12,
  paddingY: 8,
  radius: 4,
};
export const defaultTextOptions: TextOptions = {
  textWeight: 400,
  textHoverWeight: 700,
  textActiveWeight: 1000,
};
export const defaultFontOptions: FontOptions = {
  fontFamily: "JetBrains Mono",
  fontSize: 14,
};
export const defaultShapeOptions: ShapeOptions = {
  arrow: {
    width: 8,
    length: 8,
  },
  circle: {
    width: 8,
    length: 8,
  },
  diamond: {
    width: 8,
    length: 10,
  },
  triangle: {
    width: 8,
    length: 8,
  },
};
// export const defaultControlOptions: ControlOptions = {
//   dblclick: 300,
// };
export const defaultOptions: Options = {
  text: defaultTextOptions,
  layout: defaultLayoutOptions,
  font: defaultFontOptions,
  shape: defaultShapeOptions,
  // control: defaultControlOptions,
};

/**
 * Merges the default options with the provided options.
 * @param options Partial options to merge with the default options.
 * @returns The merged options.
 */
export function mergeOptions(options: PartialOptions | undefined): Options {
  return {
    text: { ...defaultTextOptions, ...options?.text },
    layout: { ...defaultLayoutOptions, ...options?.layout },
    font: { ...defaultFontOptions, ...options?.font },
    shape: {
      arrow: { ...defaultShapeOptions.arrow, ...options?.shape?.arrow },
      circle: { ...defaultShapeOptions.circle, ...options?.shape?.circle },
      diamond: { ...defaultShapeOptions.diamond, ...options?.shape?.diamond },
      triangle: { ...defaultShapeOptions.triangle, ...options?.shape?.triangle },
    },
    // control: { ...defaultControlOptions, ...options?.control },
  };
}

export function createContext(canvas: OffscreenCanvas) {
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textRendering = "optimizeLegibility";
  return ctx;
}

export type Shape = "arrow" | "circle" | "diamond" | "triangle";

export type Data<Child extends Data<Child, Key>, Key extends string | number | symbol = "path"> = {
  name: string;
  color?: string;
  backgroundColor?: string;
  children: Child[];
  dashArray?: string | number;
  outSelfShape?: Shape;
  /**
   * @description The fill color of the outSelfShape. If not provided, it will be 'none'.
   * You can also use 'currentColor' to use the current stroke color.
   */
  outSelfFill?: string;
  inChildrenShape?: (Shape | undefined)[];
  inChildrenFill?: (string | undefined)[];
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

export interface TreeEvent<T extends Data<T>, E> {
  node: T;
  state: State;
  event: E;
  scrollIntoView(): void;
}

export interface ExternalState {
  active: Ref<number | string | undefined>;
  hover: Ref<number | string | undefined>;
}
