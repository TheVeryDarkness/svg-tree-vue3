export interface ColorOptions {
  /**
   * Stroke color of node borders and links.
   */
  borderColor?: string;
  /**
   * Fill color of nodes.
   */
  backgroundColor?: string;
  /**
   * Fill color of node shadows.
   */
  shadowColor?: string;
  /**
   * Fill color of texts.
   *
   * May be overriden by {@link Data}.
   */
  textColor?: string;
  /**
   * Fill color of texts when hovering.
   */
  textHoverColor?: string;
  /**
   * Fill color of texts when active.
   */
  textActiveColor?: string;
}
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
  fontFamily?: string;
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
  color: ColorOptions;
  text: TextOptions;
  layout: LayoutOptions;
  font: FontOptions;
  shape: ShapeOptions;
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type PartialOptions = DeepPartial<Options> | undefined;
export type PartialColorOptions = DeepPartial<ColorOptions> | undefined;
export type PartialShapeOptions = DeepPartial<ShapeOptions> | undefined;

export const defaultLightColorOptions: Readonly<ColorOptions> = {
  borderColor: "gray",
  backgroundColor: "white",
  shadowColor: "darkgray",
  textColor: "black",
  textHoverColor: "darkcyan",
  textActiveColor: "darkcyan",
};
export const defaultDarkColorOptions: Readonly<ColorOptions> = {
  borderColor: "lightgray",
  backgroundColor: "darkgray",
  shadowColor: "black",
  textColor: "white",
  textHoverColor: "cyan",
  textActiveColor: "cyan",
};
export const schemeMatcher = window.matchMedia("(prefers-color-scheme: dark)");
schemeMatcher.addEventListener("change", (e) => {
  const colorKeys = ["borderColor", "backgroundColor", "shadowColor", "textColor", "textHoverColor", "textActiveColor"] as const;
  if (e.matches) {
    defaultOptions.color = defaultDarkColorOptions;
    for (const key of colorKeys) {
      defaultColorOptions[key as keyof ColorOptions] = defaultDarkColorOptions[key as keyof ColorOptions];
    }
  } else {
    defaultOptions.color = defaultLightColorOptions;
    for (const key of colorKeys) {
      defaultColorOptions[key as keyof ColorOptions] = defaultLightColorOptions[key as keyof ColorOptions];
    }
  }
});
export const defaultColorOptions: ColorOptions = schemeMatcher.matches ? defaultDarkColorOptions : defaultLightColorOptions;
export const defaultLayoutOptions: Readonly<LayoutOptions> = {
  indentX: 8,
  indentY: 16,
  marginX: 20,
  marginY: 15,
  paddingX: 12,
  paddingY: 8,
  radius: 4,
};
export const defaultTextOptions: Readonly<TextOptions> = {
  textWeight: 400,
  textHoverWeight: 700,
  textActiveWeight: 1000,
};
export const defaultFontOptions: Readonly<FontOptions> = {
  fontFamily: undefined,
  fontSize: 14,
};
export const defaultShapeOptions: Readonly<ShapeOptions> = {
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
export const defaultOptions: Options = {
  color: defaultColorOptions,
  text: defaultTextOptions,
  layout: defaultLayoutOptions,
  font: defaultFontOptions,
  shape: defaultShapeOptions,
};

/**
 * Merges the default options with the provided options.
 * @param options Partial options to merge with the default options.
 * @returns The merged options.
 */
export function mergeColorOptions(options: PartialColorOptions | undefined): ColorOptions {
  return { ...defaultColorOptions, ...options };
}

/**
 * Merges the default options with the provided options.
 * @param options Partial options to merge with the default options.
 * @returns The merged options.
 */
export function mergeShapeOptions(options: PartialShapeOptions | undefined): ShapeOptions {
  return {
    arrow: { ...defaultShapeOptions.arrow, ...options?.arrow },
    circle: { ...defaultShapeOptions.circle, ...options?.circle },
    diamond: { ...defaultShapeOptions.diamond, ...options?.diamond },
    triangle: { ...defaultShapeOptions.triangle, ...options?.triangle },
  };
}

/**
 * Merges the default options with the provided options.
 * @param options Partial options to merge with the default options.
 * @returns The merged options.
 */
export function mergeOptions(options: PartialOptions | undefined): Options {
  return {
    color: mergeColorOptions(options?.color),
    text: { ...defaultTextOptions, ...options?.text },
    layout: { ...defaultLayoutOptions, ...options?.layout },
    font: { ...defaultFontOptions, ...options?.font },
    shape: mergeShapeOptions(options?.shape),
  };
}
export function needsWatchScheme(options: PartialOptions | undefined): boolean {
  return (
    options?.color === undefined ||
    options.color.textColor === undefined ||
    options.color.backgroundColor === undefined ||
    options.color.borderColor === undefined ||
    options.color.shadowColor === undefined ||
    options.color.textHoverColor === undefined ||
    options.color.textActiveColor === undefined
  );
}

export function createContext(canvas: OffscreenCanvas) {
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textRendering = "optimizeLegibility";
  return ctx;
}

export type Shape = "arrow" | "circle" | "diamond" | "triangle";

export type Lazy<T> = T[] | ((_: T) => T[]);
export type Children<T> = { children: Lazy<T> };

export type Data<Key extends string | number | symbol = "path"> = {
  name: string;
  color?: string;
  backgroundColor?: string;
  dashArray?: string | number;
  /**
   * @description The shape of the start point of the link from this node to its children.
   */
  outSelfShape?: Shape;
  /**
   * @description The fill color of the outSelfShape. If not provided, it will be 'none'.
   * You can also use 'currentColor' to use the current stroke color.
   */
  outSelfFill?: string;
  /**
   * @description The color of links from this node to its children. If not provided, it will use the node's color.
   * You can also use 'currentColor' to use the current stroke color.
   */
  outColor?: string;
  /**
   * @description The shape of the end points of links from this node to its children.
   */
  inChildrenShape?: (Shape | undefined)[];
  inChildrenFill?: (string | undefined)[];
  /**
   * @description Whether the node has an automatically generated extensible marker (after its children if any).
   */
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
export interface Size {
  width: number;
  height: number;
}
export interface Position {
  x: number;
  y: number;
}
export interface Relative {
  left: number;
  top: number;
  right: number;
  bottom: number;
  link: string;
  in?: string;
}
export interface TreeNodeSize {
  bounding: { width: number; height: number };
  name: Rectangle;
}
export interface TextSize {
  width: number;
  height: number;
  baselineOffsetY: number;
}

export interface TreeEvent<T, E> {
  node: T;
  event: E;
  scrollIntoView(): void;
  setCollapsed(collapsed?: boolean): void;
  setVertical(vertical?: boolean): void;
  getCollapsed(): boolean;
  getVertical(): boolean;
}
