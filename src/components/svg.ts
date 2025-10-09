import type { Data, Options, Rectangle, TextSize, TextOptions, TreeNodeSize, Position, State, Size, ShapeOptions, Shape, Relative } from "./types";

/**
 * Saved properties for hot update
 */
class NodeBase<Key extends string | number | symbol = "path"> {
  protected name: string;
  protected color?: string;
  protected textColor?: string;
  protected backgroundColor?: string;
  protected dashArray?: string | number;
  protected outSelfShape?: Shape;
  protected outSelfFill?: string;
  protected outColor?: string;
  protected inChildrenShape?: (Shape | undefined)[];
  protected inChildrenFill?: (string | undefined)[];
  protected extensible: boolean;

  protected shadowColor?: string;

  protected fontFamily?: string;
  protected fontSize: number;
  protected fontWeight: number;

  protected radius: number;

  protected key?: string | number;

  protected keyProp: Key;

  protected vertical_: boolean;
  protected collapsed_: boolean;
  protected active_: boolean;
  protected hover_: boolean;

  protected static readonly extendTextContent = "+";

  protected constructor(
    name: string,
    color: string | undefined,
    textColor: string | undefined,
    backgroundColor: string | undefined,
    dashArray: string | number | undefined,
    outSelfShape: Shape | undefined,
    outSelfFill: string | undefined,
    outColor: string | undefined,
    inChildrenShape: (Shape | undefined)[] | undefined,
    inChildrenFill: (string | undefined)[] | undefined,
    extensible: boolean,
    shadowColor: string | undefined,
    fontFamily: string | undefined,
    fontSize: number,
    fontWeight: number,
    radius: number,
    key: string | number | undefined,
    keyProp: Key,
    vertical_: boolean,
    collapsed_: boolean,
    active_: boolean,
    hover_: boolean,
  ) {
    this.name = name;
    this.color = color;
    this.textColor = textColor;
    this.backgroundColor = backgroundColor;
    this.dashArray = dashArray;
    this.outSelfShape = outSelfShape;
    this.outSelfFill = outSelfFill;
    this.outColor = outColor;
    this.inChildrenShape = inChildrenShape;
    this.inChildrenFill = inChildrenFill;
    this.extensible = extensible;

    this.shadowColor = shadowColor;

    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.fontWeight = fontWeight;

    this.radius = radius;

    this.key = key;

    this.keyProp = keyProp;

    this.vertical_ = vertical_;
    this.collapsed_ = collapsed_;
    this.active_ = active_;
    this.hover_ = hover_;
  }
  protected reset(
    name: string,
    color: string | undefined,
    textColor: string | undefined,
    backgroundColor: string | undefined,
    dashArray: string | number | undefined,
    outSelfShape: Shape | undefined,
    outSelfFill: string | undefined,
    outColor: string | undefined,
    inChildrenShape: (Shape | undefined)[] | undefined,
    inChildrenFill: (string | undefined)[] | undefined,
    extensible: boolean,
    shadowColor: string | undefined,
    fontFamily: string | undefined,
    fontSize: number,
    fontWeight: number,
    radius: number,
    key: string | number | undefined,
    keyProp: Key,
    vertical_: boolean,
    collapsed_: boolean,
    active_: boolean,
    hover_: boolean,
  ) {
    this.name = name;
    this.color = color;
    this.textColor = textColor;
    this.backgroundColor = backgroundColor;
    this.dashArray = dashArray;
    this.outSelfShape = outSelfShape;
    this.outSelfFill = outSelfFill;
    this.outColor = outColor;
    this.inChildrenShape = inChildrenShape;
    this.inChildrenFill = inChildrenFill;
    this.extensible = extensible;

    this.shadowColor = shadowColor;

    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.fontWeight = fontWeight;

    this.radius = radius;

    this.key = key;

    this.keyProp = keyProp;

    this.vertical_ = vertical_;
    this.collapsed_ = collapsed_;
    this.active_ = active_;
    this.hover_ = hover_;
  }
  protected diff(other: NodeBase<Key>): Partial<NodeBase<Key>> {
    const changes: Partial<NodeBase<Key>> = {};
    for (const key of Object.keys(this) as (keyof NodeBase<Key>)[]) {
      if (this[key] !== other[key]) {
        changes[key] = this[key];
      }
    }
    return changes;
  }
}

type Child<T extends Data<T, Key>, Key extends string | number | symbol = "path"> = [SVGPathElement, SVGPathElement | null, Node<T, Key>];
type Extend = [SVGPathElement, SVGRectElement, SVGTextElement];

/**
 * A virtual node class for SVG elements.
 */
export class Node<T extends Data<T, Key>, Key extends string | number | symbol = "path"> extends NodeBase<Key> {
  private text: Position;
  private size: TreeNodeSize;

  private ref_: SVGSVGElement;
  private shadow_rect: SVGRectElement | null;
  private node_rect: SVGRectElement;
  private node_text: SVGTextElement;
  private out_shape: SVGPathElement | null;
  private children_: Child<T, Key>[];
  private parent_?: WeakRef<Node<T, Key>>;
  private extend: Extend | null;

  private static computeFontWeight(options: TextOptions, state: State): number {
    const { textWeight, textHoverWeight, textActiveWeight } = options;
    return state.active ? textActiveWeight : state.hover ? textHoverWeight : textWeight;
  }

  private static computeCtxFont(fontFamily: string | undefined, fontSize: number, fontWeight: number): string {
    return `${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  /**
   * Compute the size of the text using the provided canvas context and font settings.
   */
  private static computeTextSize(ctx: OffscreenCanvasRenderingContext2D, text: string): TextSize {
    // ctx.font = ctxFont;
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    const baselineOffsetY = metrics.fontBoundingBoxAscent;
    return { width, height, baselineOffsetY };
  }

  /**
   * Compute the size of the rectangle based on its text content and layout options.
   */
  private static computeRectSize(textSize: TextSize, padding: Position): Size {
    const width = textSize.width + padding.x * 2;
    const height = textSize.height + padding.y * 2;
    return { width, height };
  }

  /**
   * Compute the size of the extend mark using the provided canvas context and font settings.
   */
  private static computeExtendTextSize(ctx: OffscreenCanvasRenderingContext2D, text: string): TextSize {
    // ctx.font = ctxFont;
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    const baselineOffsetY = metrics.fontBoundingBoxAscent;
    return { width, height, baselineOffsetY };
  }

  /**
   * Compute the size of the extend mark based on its text content and layout options.
   */
  private static computeExtendRectSize(textSize: TextSize, padding: Position): Size {
    const width = textSize.width + padding.x * 2;
    const height = textSize.height + padding.y * 2;
    return { width, height };
  }

  /**
   * Compute the size of the extend mark based on its text content and layout options.
   */
  private static computeExtendSize(rectSize: Size, margin: Position): TreeNodeSize {
    return {
      bounding: { width: rectSize.width + margin.x * 2, height: rectSize.height + margin.y * 2 },
      name: { x: margin.x, y: margin.y, width: rectSize.width, height: rectSize.height },
    };
  }

  /**
   * Compute the size of the bounding box of the node, including its children if not collapsed.
   */
  private static computeSize(rectSize: Size, indent: Position, margin: Position, children: Size[], extend: Size, extensible: boolean, collapsed: boolean, vertical: boolean): Size {
    const all = extensible ? [...children, extend] : children;
    if (collapsed)
      return {
        width: rectSize.width + margin.x * 2,
        height: rectSize.height + margin.y * 2,
      };
    if (vertical) {
      return {
        width: Math.max(
          all.reduce((acc, cur) => Math.max(acc, cur.width + rectSize.width / 2 + indent.x + margin.x), rectSize.width + margin.x * 2),
          rectSize.width + margin.x * 2,
        ),
        height: margin.y + rectSize.height + all.reduce((acc, cur) => acc + cur.height, 0) + (all.length === 0 ? margin.y : -(all.length - 1) * margin.y),
      };
    } else {
      return {
        width: Math.max(all.reduce((acc, cur) => acc + cur.height, 0) - Math.max(0, all.length - 1) * margin.x, rectSize.width + margin.x * 2),
        height: margin.y + rectSize.height + indent.y + all.reduce((acc, cur) => Math.max(acc, cur.height), 0),
      };
    }
  }

  /**
   * Compute the total width of all child nodes including margins.
   *
   * *Horizontal layout only*.
   */
  private static computeChildrenWidth(all: TreeNodeSize[], marginX: number): number {
    return all.reduce((acc, cur) => acc + cur.bounding.width, 0) + Math.max(0, all.length - 1) * marginX;
  }

  /**
   * Compute the center x position of the node based on its children's positions.
   *
   * *Horizontal layout only*.
   *
   * @param children - Array of child node sizes and positions (in its coordinate space). Including the extend mark if exists.
   */
  private static computeNodeCenterX(all: TreeNodeSize[], width: number, rectWidth: number, marginX: number): number {
    const childrenWidth = this.computeChildrenWidth(all, marginX);
    if (all.length === 0) return width / 2;
    const first = all[0];
    const last = all[all.length - 1];
    const leftFirst = Math.max(0, width - childrenWidth) / 2;
    const firstMiddleX = first.name.x + first.name.width / 2;
    const lastMiddleX = last.name.x + last.name.width / 2;
    const middle = leftFirst + (lastMiddleX + firstMiddleX) / 2;
    return Math.max(Math.min(middle, width - (rectWidth / 2 + marginX)), rectWidth / 2 + marginX);
  }

  /**
   * Compute the SVG path data for the outgoing shape of the node.
   * @returns A tuple containing the SVG path data string and the length offset for positioning.
   */
  private static computeOutShape(shape: Shape, options: ShapeOptions, rect: Rectangle, centerX: number, margin: Position, vertical: boolean): [string, number] {
    // Starting point
    const [x1, y1] = vertical ? [margin.x + rect.width / 2, margin.y + rect.height] : [centerX, margin.y + rect.height];

    const offset = 1;

    switch (shape) {
      case "arrow": {
        const { width, length } = options.arrow;
        return [
          `M ${x1 - width / 2} ${y1 + length + offset}
l ${width / 2} ${-length}
l ${width / 2} ${length}
`,
          offset,
        ];
      }
      case "circle": {
        const { width, length } = options.circle;
        return [
          `M ${x1} ${y1 + offset}
a ${width / 2} ${length / 2} 0.5 1 1 0 ${length}
a ${width / 2} ${length / 2} 0.5 1 1 0 ${-length}
`,
          length + offset,
        ];
      }
      case "diamond": {
        const { width, length } = options.diamond;
        return [
          `M ${x1} ${y1 + offset}
l ${width / 2} ${length / 2}
l ${-width / 2} ${length / 2}
l ${-width / 2} ${-length / 2}
Z`,
          length + offset,
        ];
      }
      case "triangle": {
        const { width, length } = options.triangle;
        return [
          `M ${x1} ${y1 + offset}
l ${width / 2} ${length}
l ${-width} 0
Z
`,
          length + offset,
        ];
      }
    }
  }

  /**
   * Compute the relative positions and link paths for child nodes.
   * @returns A tuple containing:
   * - An array of `Relative` objects for each child.
   * - An `Relative` object for the extend mark.
   * @param children Array of child node sizes and positions (in its coordinate space). Should not include the extend mark.
   */
  private static computeChildrenRelatives(
    radius: number,
    options: ShapeOptions,
    bounding: Size,
    rect: Size,
    indent: Position,
    margin: Position,
    outOffset: number,
    children: TreeNodeSize[],
    inChildrenShape: (Shape | undefined)[] | undefined,
    extendNodeSize: TreeNodeSize,
    extensible: boolean,
    vertical: boolean,
  ): [Relative[], Relative] {
    const offset = 1;
    if (vertical) {
      const cur = {
        left: margin.x + rect.width / 2 + indent.x,
        top: margin.y + rect.height,
      };
      function next(value: TreeNodeSize, shape?: Shape): Relative {
        const left = cur.left;
        const top = cur.top;
        const right = left + value.bounding.width;
        const bottom = top + value.bounding.height;

        const x1 = margin.x + rect.width / 2;
        const y1 = margin.y + rect.height + outOffset;
        const x2 = x1;
        const y2 = top + value.name.y + value.name.height / 2;
        const dx3 = indent.x + value.name.x;
        function inShapes(shape?: Shape): [string, number] | undefined {
          switch (shape) {
            case "arrow": {
              const { width, length } = options.arrow;
              return [
                `M ${x2 + dx3 - length - offset} ${y2 - width / 2}
l ${length} ${width / 2}
l ${-length} ${width / 2}`,
                offset,
              ];
            }
            case "circle": {
              const { width, length } = options.circle;
              return [
                `M ${x2 + dx3 - length - offset} ${y2}
a ${length / 2} ${width / 2} 0.5 1 1 ${length} 0
a ${length / 2} ${width / 2} 0.5 1 1 ${-length} 0
Z`,
                length + offset,
              ];
            }
            case "diamond": {
              const { width, length } = options.diamond;
              return [
                `M ${x2 + dx3 - length - offset} ${y2}
l ${length / 2} ${-width / 2}
l ${length / 2} ${width / 2}
l ${-length / 2} ${width / 2}
Z`,
                length + offset,
              ];
            }
            case "triangle": {
              const { width, length } = options.triangle;
              return [
                `M ${x2 + dx3 - length - offset} ${y2 - width / 2}
l ${length} ${width / 2}
l ${-length} ${width / 2}
l ${0} ${-width}
Z`,
                length + offset,
              ];
            }
          }
        }
        const inShape = inShapes(shape);
        // Round angle:
        // `M ${x1} ${y1} L ${x2} ${y2 - radius} s 0 ${radius} ${radius} ${radius} l ${dx3 - radius} 0`
        // Straight angle:
        // `M ${x1} ${y1} L ${x2} ${y2} l ${dx3} 0`
        const link = `M ${x1} ${y1} L ${x2} ${y2 - radius} s 0 ${radius} ${radius} ${radius} l ${dx3 - radius - (inShape?.[1] ?? 0)} 0`;
        cur.top = bottom - margin.y;
        return { left, top, right, bottom, link, in: inShape?.[0] };
      }
      const results = children.map((value, i) => next(value, inChildrenShape?.[i]));
      const e = next(extendNodeSize);
      return [results, e];
    } else {
      const all = extensible ? [...children, extendNodeSize] : children;
      const childrenWidth = this.computeChildrenWidth(all, margin.x);
      const cur = {
        left: Math.max(0, bounding.width - childrenWidth) / 2,
        top: margin.y + rect.height + indent.y,
      };
      const middle = this.computeNodeCenterX(all, bounding.width, rect.width, margin.x);
      function next(value: TreeNodeSize, shape?: Shape): Relative {
        const left = cur.left;
        const top = cur.top;
        const right = left + value.bounding.width;
        const bottom = top + value.bounding.height;
        const x1 = middle;
        const y1 = margin.y + rect.height + outOffset;
        const dy2 = indent.y - outOffset;
        const x3 = cur.left + value.name.x + value.name.width / 2;
        // const dx3 = x3 - x1
        const y3 = cur.top;
        const dy4 = value.name.y;
        function inShapes(shape?: Shape): [string, number] | undefined {
          switch (shape) {
            case "arrow": {
              const { width, length } = options.arrow;
              return [
                `M ${x3 + width / 2} ${y3 + dy4 - length - offset}
l ${-width / 2} ${length}
l ${-width / 2} ${-length}`,
                offset,
              ];
            }
            case "circle": {
              const { width, length } = options.arrow;
              return [
                `M ${x3} ${y3 + dy4 - length - offset}
a ${width / 2} ${length / 2} 0.5 1 1 0 ${length}
a ${width / 2} ${length / 2} 0.5 1 1 0 ${-length}
Z`,
                length + offset,
              ];
            }
            case "diamond": {
              const { width, length } = options.diamond;
              return [
                `M ${x3} ${y3 + dy4 - length - offset}
l ${width / 2} ${length / 2}
l ${-width / 2} ${length / 2}
l ${-width / 2} ${-length / 2}
Z`,
                length + offset,
              ];
            }
            case "triangle": {
              const { width, length } = options.triangle;
              return [
                `M ${x3 + width / 2} ${y3 + dy4 - length - offset}
l ${-width / 2} ${length}
l ${-width / 2} ${-length}
Z`,
                length + offset,
              ];
            }
          }
        }
        const inShape = inShapes(shape);
        // Right:
        // `M ${x1} ${y1} l 0 ${indentY / 2} L ${x3 - radius} ${y3} s ${radius} 0 ${radius} ${radius} l 0 ${dy4 - radius}`
        // Left:
        // `M ${x1} ${y1} l 0 ${indentY / 2} L ${x3} ${y3} s ${-radius} 0 ${-radius} ${radius} l 0 ${dy4 - radius}`
        const link = `M ${x1} ${y1} l 0 ${dy2} L ${x3} ${y3} l 0 ${dy4 - (inShape?.[1] ?? 0)}`;
        cur.left = right - margin.x;
        return { left, top, right, bottom, link, in: inShape?.[0] };
      }
      const results = children.map((value, i) => next(value, inChildrenShape?.[i]));
      const e = next(extendNodeSize);
      return [results, e];
    }
  }

  private static computeRectPosition(
    children: TreeNodeSize[],
    extendNodeSize: TreeNodeSize,
    extensible: boolean,
    bounding: Size,
    rect: Size,
    margin: Position,
    vertical: boolean,
    collapsed: boolean,
  ): Rectangle {
    if ((children.length === 0 && !extensible) || collapsed) {
      return {
        x: margin.x,
        y: margin.y,
        width: rect.width,
        height: rect.height,
      };
    } else if (vertical) {
      return {
        x: margin.x,
        y: margin.y,
        width: rect.width,
        height: rect.height,
      };
    } else {
      const all = extensible ? [...children, extendNodeSize] : children;
      const middle = this.computeNodeCenterX(all, bounding.width, rect.width, margin.x);
      return {
        x: middle - rect.width / 2,
        y: margin.y,
        width: rect.width,
        height: rect.height,
      };
    }
  }

  private static computeTextPosition(rect: Rectangle, margin: Position, padding: Position, textSize: TextSize): Position {
    return {
      x: rect.x + padding.x,
      y: margin.y + textSize.baselineOffsetY + padding.y,
    };
  }

  private static setupShadow(shadow: SVGRectElement, radius: number, rectPosition: Rectangle, shadowColor: string | undefined) {
    shadow.classList.add("shadow");
    if (shadowColor) shadow.style.fill = shadowColor;
    shadow.setAttribute("x", String(rectPosition.x + 4));
    shadow.setAttribute("y", String(rectPosition.y + 4));
    shadow.setAttribute("width", String(rectPosition.width));
    shadow.setAttribute("height", String(rectPosition.height));
    shadow.setAttribute("rx", String(radius));
    shadow.setAttribute("ry", String(radius));
  }

  private static setupOutShape(out_shape: SVGPathElement, outSelfFill: string | undefined) {
    out_shape.classList.add("link");
    out_shape.style.fill = outSelfFill ?? "none";
    out_shape.style.strokeLinejoin = "round";
  }

  private static setupInChildLink(path: SVGPathElement, outColor: string | undefined, dashArray: string | number | undefined) {
    path.classList.add("link");
    if (outColor) path.style.color = outColor;
    path.style.fill = "none";
    if (dashArray) path.style.strokeDasharray = String(dashArray);
    // path.style.strokeLinejoin = "round";
  }

  private static setupInChildShape(inShape: SVGPathElement, color: string | undefined, inChildFill: string | undefined) {
    inShape.classList.add("link");
    if (color) inShape.style.color = color;
    inShape.style.fill = inChildFill ?? "none";
    inShape.style.strokeLinejoin = "round";
  }

  private static setupChild<T extends Data<T, Key>, Key extends string | number | symbol = "path">(
    [path, inShape, child]: Child<T, Key>,
    outColor: string | undefined,
    dashArray: string | number | undefined,
    relative: Relative,
  ) {
    this.setupInChildLink(path, outColor, dashArray);
    if (inShape) this.setupInChildShape(inShape, child.color, child.outSelfFill);

    path.setAttribute("d", relative.link);

    if (inShape && relative.in) {
      inShape.setAttribute("d", relative.in);
    }

    child.ref_.setAttribute("x", String(relative.left));
    child.ref_.setAttribute("y", String(relative.top));
  }

  private static setupExtend(
    [extend_path, extend_rect, extend_text]: Extend,
    color: string | undefined,
    backgroundColor: string | undefined,
    outColor: string | undefined,
    textColor: string | undefined,
    fontFamily: string | undefined,
    fontSize: number,
    fontWeight: number,
    relative: Relative,
    extendSize: TreeNodeSize,
    extendPosition: Position,
    radius: number,
  ) {
    extend_path.classList.add("link", "extend");
    extend_path.style.fill = "none";
    if (outColor) extend_path.style.color = outColor;

    extend_rect.classList.add("rect", "extend");
    extend_rect.style.boxSizing = "border-box";
    if (color) extend_rect.style.color = color;
    extend_rect.style.cursor = "pointer";
    if (backgroundColor) extend_rect.style.fill = backgroundColor;

    extend_text.textContent = Node.extendTextContent;
    extend_text.classList.add("text", "extend");
    extend_text.style.cursor = "pointer";
    if (textColor) extend_text.style.fill = textColor;
    if (fontFamily) extend_text.style.fontFamily = fontFamily;
    extend_text.style.fontSize = fontSize.toString();
    extend_text.style.fontWeight = fontWeight.toString();
    extend_text.style.userSelect = "none";

    extend_path.setAttribute("d", relative.link);

    extend_rect.setAttribute("x", String(relative.left + extendSize.name.x));
    extend_rect.setAttribute("y", String(relative.top + extendSize.name.y));
    extend_rect.setAttribute("width", String(extendSize.name.width));
    extend_rect.setAttribute("height", String(extendSize.name.height));
    extend_rect.setAttribute("rx", String(radius));
    extend_rect.setAttribute("ry", String(radius));

    extend_text.setAttribute("x", String(relative.left + extendPosition.x));
    extend_text.setAttribute("y", String(relative.top + extendPosition.y));
  }

  private static setupSelf(
    [node_rect, node_text]: [SVGRectElement, SVGTextElement],
    size: TreeNodeSize,
    text: Position,
    name: string,
    color: string | undefined,
    backgroundColor: string | undefined,
    textColor: string | undefined,
    fontFamily: string | undefined,
    fontSize: number,
    fontWeight: number,
    radius: number,
  ) {
    node_rect.classList.add("rect", "node");
    node_rect.setAttribute("x", String(size.name.x));
    node_rect.setAttribute("y", String(size.name.y));
    node_rect.setAttribute("width", String(size.name.width));
    node_rect.setAttribute("height", String(size.name.height));
    node_rect.setAttribute("rx", String(radius));
    node_rect.setAttribute("ry", String(radius));
    if (color) node_rect.style.color = color;
    if (backgroundColor) node_rect.style.fill = backgroundColor;
    node_rect.style.boxSizing = "border-box";
    node_rect.style.cursor = "pointer";

    node_text.textContent = name;
    node_text.classList.add("node", "text");
    node_text.setAttribute("x", String(text.x));
    node_text.setAttribute("y", String(text.y));
    if (textColor) node_text.style.fill = textColor;
    node_text.style.userSelect = "none";
    if (fontFamily) node_text.style.fontFamily = fontFamily;
    node_text.style.fontSize = String(fontSize);
    node_text.style.fontWeight = String(fontWeight);
    node_text.style.cursor = "pointer";
  }

  private static setupRoot<T extends Data<T, Key>, Key extends string | number | symbol = "path">(ref_: SVGSVGElement, data: Data<T, Key>, keyProp: Key, size: TreeNodeSize) {
    ref_.classList.add("svg-tree-node");

    ref_.setAttribute("enable-background", "true");
    ref_.style.fill = "none";
    ref_.setAttribute("svg-key", data[keyProp]?.toString() ?? "");

    ref_.setAttribute("width", String(size.bounding.width));
    ref_.setAttribute("height", String(size.bounding.height));
    ref_.setAttribute("viewBox", `0 0 ${size.bounding.width} ${size.bounding.height}`);
  }

  private constructor(data: T, keyProp: Key, options: Options, ctx: OffscreenCanvasRenderingContext2D, parent?: WeakRef<Node<T, Key>>) {
    const name = data.name;
    const collapsed = typeof data.children === "function";
    const vertical = true;
    const extensible = data.extensible ?? false;

    const { fontFamily, fontSize } = options.font;
    const active = false;
    const hover = false;
    const fontWeight = Node.computeFontWeight(options.text, { active, hover });

    const { indentX, indentY, marginX, marginY, paddingX, paddingY } = options.layout;
    const indent = { x: indentX, y: indentY };
    const margin = { x: marginX, y: marginY };
    const padding = { x: paddingX, y: paddingY };

    super(
      name,
      data.color ?? options.color.borderColor,
      data.color ?? options.color.textColor,
      data.backgroundColor ?? options.color.backgroundColor,
      data.dashArray,
      data.outSelfShape,
      data.outSelfFill,
      data.outColor ?? data.color ?? options.color.borderColor,
      data.inChildrenShape,
      data.inChildrenFill,
      extensible,
      options.color.shadowColor,
      fontFamily,
      fontSize,
      fontWeight,
      options.layout.radius,
      data[keyProp],
      keyProp,
      vertical,
      collapsed,
      active,
      hover,
    );

    const ctxFont = Node.computeCtxFont(fontFamily, fontSize, fontWeight);
    ctx.font = ctxFont;

    const children_elements: SVGElement[] = [];

    const ref_ = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    if (collapsed) {
      this.out_shape = null;
      this.children_ = [];
      this.extend = null;

      const textSize = Node.computeTextSize(ctx, name);
      const rectSize = Node.computeRectSize(textSize, padding);
      const extendTextSize = Node.computeExtendTextSize(ctx, Node.extendTextContent);
      const extendRectSize = Node.computeExtendRectSize(extendTextSize, padding);
      const extendSize = Node.computeExtendSize(extendRectSize, margin);
      const boundingSize = Node.computeSize(rectSize, indent, margin, [], extendSize.bounding, extensible, collapsed, vertical);
      const rectPosition = Node.computeRectPosition([], extendSize, extensible, boundingSize, rectSize, margin, vertical, collapsed);
      this.size = {
        bounding: boundingSize,
        name: rectPosition,
      };

      // Shadow rect
      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      Node.setupShadow(shadow, this.radius, rectPosition, this.shadowColor);
      this.shadow_rect = shadow;
      children_elements.push(shadow);

      this.text = Node.computeTextPosition(this.size.name, margin, padding, textSize);
    } else {
      this.shadow_rect = null;

      const out_shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      Node.setupOutShape(out_shape, this.outSelfFill);
      this.out_shape = out_shape;
      children_elements.push(out_shape);

      const self = this;
      const children_nodes = typeof data.children === "function" ? data.children(data) : data.children;

      const children = children_nodes.map(function (data, index): [SVGPathElement, SVGPathElement | null, Node<T, Key>] {
        const child = new Node(data, keyProp, options, ctx, new WeakRef(self));

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        Node.setupInChildLink(path, self.outColor, self.dashArray);
        children_elements.push(path);

        let inShape: SVGPathElement | null = null;
        const inChildShape = self.inChildrenShape?.[index];
        const inChildFill = self.inChildrenFill?.[index];
        if (inChildShape) {
          inShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
          Node.setupInChildShape(inShape, self.color, inChildFill);
          children_elements.push(inShape);
        }

        return [path, inShape, child];
      }, this);

      for (const [path, inShape, child] of children) {
        children_elements.push(path);
        if (inShape) children_elements.push(inShape);
        children_elements.push(child.ref_);
      }

      this.children_ = children;

      if (this.extensible) {
        const extend_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const extend_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        const extend_text = document.createElementNS("http://www.w3.org/2000/svg", "text");

        children_elements.push(extend_path, extend_rect, extend_text);

        this.extend = [extend_path, extend_rect, extend_text];
      } else {
        this.extend = null;
      }

      const textSize = Node.computeTextSize(ctx, this.name);
      const rectSize = Node.computeRectSize(textSize, padding);
      const extendTextSize = Node.computeExtendTextSize(ctx, Node.extendTextContent);
      const extendRectSize = Node.computeExtendRectSize(extendTextSize, padding);
      const extendSize = Node.computeExtendSize(extendRectSize, margin);
      const boundingSize = Node.computeSize(
        rectSize,
        indent,
        margin,
        this.children_.map((c) => c[2].size.bounding),
        extendSize.bounding,
        this.extensible,
        this.collapsed_,
        this.vertical_,
      );
      const extendPosition = Node.computeTextPosition(extendSize.name, margin, padding, extendTextSize);
      const rectPosition = Node.computeRectPosition(
        this.children_.map((c) => c[2].size),
        extendSize,
        this.extensible,
        boundingSize,
        rectSize,
        margin,
        this.vertical_,
        this.collapsed_,
      );

      let outOffset = 0;
      if (this.outSelfShape) {
        const outShape = Node.computeOutShape(this.outSelfShape, options.shape, rectPosition, rectPosition.x + rectPosition.width / 2, margin, this.vertical_);
        if (this.outColor) this.out_shape.style.color = this.outColor;
        this.out_shape.setAttribute("d", outShape[0]);
        outOffset = outShape[1];
      }
      const relatives = Node.computeChildrenRelatives(
        this.radius,
        options.shape,
        boundingSize,
        rectSize,
        indent,
        margin,
        outOffset,
        children.map((c) => c[2].size),
        this.inChildrenShape,
        extendSize,
        this.extensible,
        this.vertical_,
      );
      for (let i = 0; i < children.length; i++) {
        const [path, inShape, child] = children[i];
        const relative = relatives[0][i];

        Node.setupChild([path, inShape, child], this.outColor, this.dashArray, relative);
      }
      if (this.extend && this.extensible) {
        const relative = relatives[1];

        Node.setupExtend(
          this.extend,
          this.color,
          this.backgroundColor,
          this.outColor,
          this.textColor,
          fontFamily,
          fontSize,
          fontWeight,
          relative,
          extendSize,
          extendPosition,
          this.radius,
        );
      }

      this.size = {
        bounding: boundingSize,
        name: rectPosition,
      };
      this.text = Node.computeTextPosition(this.size.name, margin, padding, textSize);
    }

    {
      const node_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      this.node_rect = node_rect;

      const node_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      this.node_text = node_text;

      children_elements.push(node_rect, node_text);

      Node.setupSelf([node_rect, node_text], this.size, this.text, this.name, this.color, this.backgroundColor, this.textColor, fontFamily, fontSize, fontWeight, this.radius);
    }

    Node.setupRoot(ref_, data, keyProp, this.size);

    this.ref_ = ref_;
    this.parent_ = parent;
    this.ref_.append(...children_elements);
  }

  static create<T extends Data<T, Key>, Key extends string | number | symbol = "path">(
    data: T,
    keyProp: Key,
    options: Options,
    ctx: OffscreenCanvasRenderingContext2D,
  ): Node<T, Key> {
    return new Node(data, keyProp, options, ctx);
  }

  scrollIntoView(behavior: ScrollBehavior = "smooth", block: ScrollLogicalPosition = "center", inline: ScrollLogicalPosition = "center") {
    this.ref_.scrollIntoView({ behavior, block, inline });
  }

  protected requestSkeletonUpdate() {}
  protected recomputeStyle() {}

  //   update(data: T, keyProp: Key, options: Options, ctx: OffscreenCanvasRenderingContext2D) {
  //     const name = data.name;
  //     const collapsed = typeof data.children === "function";
  //     const vertical = true;
  //     const extensible = data.extensible ?? false;

  //     const { fontFamily, fontSize } = options.font;
  //     const active = false;
  //     const hover = false;
  //     const fontWeight = Node.computeFontWeight(options.text, { active, hover });

  //     const { indentX, indentY, marginX, marginY, paddingX, paddingY } = options.layout;
  //     const indent = { x: indentX, y: indentY };
  //     const margin = { x: marginX, y: marginY };
  //     const padding = { x: paddingX, y: paddingY };

  //     super.reset(
  //       name,
  //       data.color ?? options.color.borderColor,
  //       data.color ?? options.color.textColor,
  //       data.backgroundColor ?? options.color.backgroundColor,
  //       data.dashArray,
  //       data.outSelfShape,
  //       data.outSelfFill,
  //       data.outColor ?? data.color ?? options.color.borderColor,
  //       data.inChildrenShape,
  //       data.inChildrenFill,
  //       extensible,
  //       options.color.shadowColor,
  //       fontFamily,
  //       fontSize,
  //       fontWeight,
  //       options.layout.radius,
  //       data[keyProp],
  //       keyProp,
  //       vertical,
  //       collapsed,
  //       active,
  //       hover,
  //     );

  //     const ctxFont = Node.computeCtxFont(fontFamily, fontSize, fontWeight);
  //     ctx.font = ctxFont;

  //     const children_elements: SVGElement[] = [];

  //     const ref_ = this.ref_;

  //     if (collapsed) {
  //       this.out_shape = null;
  //       this.children_ = [];
  //       this.extend = null;

  //       const textSize = Node.computeTextSize(ctx, name);
  //       const rectSize = Node.computeRectSize(textSize, padding);
  //       const extendTextSize = Node.computeExtendTextSize(ctx, Node.extendTextContent);
  //       const extendRectSize = Node.computeExtendRectSize(extendTextSize, padding);
  //       const extendSize = Node.computeExtendSize(extendRectSize, margin);
  //       const boundingSize = Node.computeSize(rectSize, indent, margin, [], extendSize.bounding, extensible, collapsed, vertical);
  //       const rectPosition = Node.computeRectPosition([], extendSize, extensible, boundingSize, rectSize, margin, vertical, collapsed);
  //       this.size = {
  //         bounding: boundingSize,
  //         name: rectPosition,
  //       };

  //       // Shadow rect
  //       if (this.shadow_rect) {
  //         const shadow = this.shadow_rect;
  //         shadow.classList.add("shadow");
  //         if (this.shadowColor) shadow.style.fill = this.shadowColor;
  //         shadow.setAttribute("x", String(rectPosition.x + 4));
  //         shadow.setAttribute("y", String(rectPosition.y + 4));
  //         shadow.setAttribute("width", String(rectPosition.width));
  //         shadow.setAttribute("height", String(rectPosition.height));
  //         shadow.setAttribute("rx", String(options.layout.radius));
  //         shadow.setAttribute("ry", String(options.layout.radius));
  //         this.shadow_rect = shadow;
  //         children_elements.push(shadow);
  //       }

  //       this.text = Node.computeTextPosition(this.size.name, margin, padding, textSize);
  //     } else {
  //       this.shadow_rect = null;

  //       if (this.out_shape) {
  //         const out_shape = this.out_shape;
  //         out_shape.classList.add("link");
  //         out_shape.style.fill = this.outSelfFill ?? "none";
  //         out_shape.style.strokeLinejoin = "round";
  //         children_elements.push(out_shape);
  //       }

  //       const self = this;
  //       const children_nodes = typeof data.children === "function" ? data.children(data) : data.children;

  //       const children = children_nodes.map(function (data, index): [SVGPathElement, SVGPathElement | null, Node<T, Key>] {
  //         const child = new Node(data, keyProp, options, ctx, self);

  //         const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  //         path.classList.add("link");
  //         if (self.outColor) path.style.color = self.outColor;
  //         path.style.fill = "none";
  //         if (self.dashArray) path.style.strokeDasharray = String(self.dashArray);
  //         // path.style.strokeLinejoin = "round";
  //         children_elements.push(path);

  //         let inShape: SVGPathElement | null = null;
  //         const inChildShape = self.inChildrenShape?.[index];
  //         const inChildFill = self.inChildrenFill?.[index];
  //         if (inChildShape) {
  //           inShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  //           inShape.classList.add("link");
  //           if (self.color) inShape.style.color = self.color;
  //           inShape.style.fill = inChildFill ?? "none";
  //           inShape.style.strokeLinejoin = "round";
  //           children_elements.push(inShape);
  //         }

  //         return [path, inShape, child];
  //       }, this);

  //       for (const [path, inShape, child] of children) {
  //         children_elements.push(path);
  //         if (inShape) children_elements.push(inShape);
  //         children_elements.push(child.ref_);
  //       }

  //       this.children_ = children;

  //       if (this.extensible && this.extend) {
  //         const extend_path = this.extend[0];
  //         extend_path.classList.add("link", "extend");
  //         extend_path.style.fill = "none";
  //         if (this.outColor) extend_path.style.color = this.outColor;
  //         children_elements.push(extend_path);

  //         const extend_rect = this.extend[1];
  //         extend_rect.classList.add("rect", "extend");
  //         extend_rect.style.boxSizing = "border-box";
  //         if (this.color) extend_rect.style.color = this.color;
  //         extend_rect.style.cursor = "pointer";
  //         if (this.backgroundColor) extend_rect.style.fill = this.backgroundColor;
  //         children_elements.push(extend_rect);

  //         const extend_text = this.extend[2];
  //         extend_text.textContent = Node.extendTextContent;
  //         extend_text.classList.add("text", "extend");
  //         extend_text.style.cursor = "pointer";
  //         if (this.textColor) extend_text.style.fill = this.textColor;
  //         if (this.fontFamily) extend_text.style.fontFamily = this.fontFamily;
  //         extend_text.style.fontSize = this.fontSize.toString();
  //         extend_text.style.fontWeight = this.fontWeight.toString();
  //         extend_text.style.userSelect = "none";
  //         children_elements.push(extend_text);

  //         this.extend = [extend_path, extend_rect, extend_text];
  //       } else {
  //         this.extend = null;
  //       }

  //       const textSize = Node.computeTextSize(ctx, this.name);
  //       const rectSize = Node.computeRectSize(textSize, padding);
  //       const extendTextSize = Node.computeExtendTextSize(ctx, Node.extendTextContent);
  //       const extendRectSize = Node.computeExtendRectSize(extendTextSize, padding);
  //       const extendSize = Node.computeExtendSize(extendRectSize, margin);
  //       const boundingSize = Node.computeSize(
  //         rectSize,
  //         indent,
  //         margin,
  //         this.children_.map((c) => c[2].size.bounding),
  //         extendSize.bounding,
  //         this.extensible,
  //         this.collapsed_,
  //         this.vertical_,
  //       );
  //       const extendPosition = Node.computeTextPosition(extendSize.name, margin, padding, extendTextSize);
  //       const rectPosition = Node.computeRectPosition(
  //         this.children_.map((c) => c[2].size),
  //         extendSize,
  //         this.extensible,
  //         boundingSize,
  //         rectSize,
  //         margin,
  //         this.vertical_,
  //         this.collapsed_,
  //       );

  //       let outOffset = 0;
  //       if (this.outSelfShape && this.out_shape) {
  //         const outShape = Node.computeOutShape(this.outSelfShape, options.shape, rectPosition, rectPosition.x + rectPosition.width / 2, margin, this.vertical_);
  //         if (this.outColor) this.out_shape.style.color = this.outColor;
  //         this.out_shape.setAttribute("d", outShape[0]);
  //         outOffset = outShape[1];
  //       }
  //       const relatives = Node.computeChildrenRelatives(
  //         this.radius,
  //         options.shape,
  //         boundingSize,
  //         rectSize,
  //         indent,
  //         margin,
  //         outOffset,
  //         children.map((c) => c[2].size),
  //         this.inChildrenShape,
  //         extendSize,
  //         this.extensible,
  //         this.vertical_,
  //       );
  //       for (let i = 0; i < children.length; i++) {
  //         const [path, inShape, child] = children[i];
  //         const relative = relatives[0][i];
  //         path.setAttribute("d", relative.link);
  //         if (inShape && relative.in) {
  //           inShape.setAttribute("d", relative.in);
  //         }
  //         child.ref_.setAttribute("x", String(relative.left));
  //         child.ref_.setAttribute("y", String(relative.top));
  //       }
  //       if (this.extend && this.extensible) {
  //         const [extend_path, extend_rect, extend_text] = this.extend;
  //         const relative = relatives[1];
  //         extend_path.setAttribute("d", relative.link);

  //         extend_rect.setAttribute("x", String(relative.left + extendSize.name.x));
  //         extend_rect.setAttribute("y", String(relative.top + extendSize.name.y));
  //         extend_rect.setAttribute("width", String(extendSize.name.width));
  //         extend_rect.setAttribute("height", String(extendSize.name.height));
  //         extend_rect.setAttribute("rx", String(options.layout.radius));
  //         extend_rect.setAttribute("ry", String(options.layout.radius));

  //         extend_text.setAttribute("x", String(relative.left + extendPosition.x));
  //         extend_text.setAttribute("y", String(relative.top + extendPosition.y));
  //       }

  //       this.size = {
  //         bounding: boundingSize,
  //         name: rectPosition,
  //       };
  //       this.text = Node.computeTextPosition(this.size.name, margin, padding, textSize);
  //     }

  //     {
  //       const node_rect = this.node_rect;
  //       node_rect.classList.add("rect", "node");
  //       node_rect.setAttribute("x", String(this.size.name.x));
  //       node_rect.setAttribute("y", String(this.size.name.y));
  //       node_rect.setAttribute("width", String(this.size.name.width));
  //       node_rect.setAttribute("height", String(this.size.name.height));
  //       node_rect.setAttribute("rx", String(options.layout.radius));
  //       node_rect.setAttribute("ry", String(options.layout.radius));
  //       if (this.color) node_rect.style.color = this.color;
  //       if (this.backgroundColor) node_rect.style.fill = this.backgroundColor;
  //       node_rect.style.boxSizing = "border-box";
  //       node_rect.style.cursor = "pointer";
  //       this.node_rect = node_rect;
  //       children_elements.push(node_rect);
  //     }

  //     {
  //       const node_text = this.node_text;
  //       node_text.textContent = this.name;
  //       node_text.classList.add("node", "text");
  //       node_text.setAttribute("x", String(this.text.x));
  //       node_text.setAttribute("y", String(this.text.y));
  //       if (this.textColor) node_text.style.fill = this.textColor;
  //       node_text.style.userSelect = "none";
  //       if (this.fontFamily) node_text.style.fontFamily = this.fontFamily;
  //       node_text.style.fontSize = String(this.fontSize);
  //       node_text.style.fontWeight = String(this.fontWeight);
  //       node_text.style.cursor = "pointer";
  //       this.node_text = node_text;
  //       children_elements.push(node_text);
  //     }

  //     ref_.classList.add("svg-tree-node");

  //     ref_.setAttribute("enable-background", "true");
  //     ref_.style.fill = "none";
  //     ref_.setAttribute("svg-key", data[keyProp]?.toString() ?? "");

  //     ref_.setAttribute("width", String(this.size.bounding.width));
  //     ref_.setAttribute("height", String(this.size.bounding.height));
  //     ref_.setAttribute("viewBox", `0 0 ${this.size.bounding.width} ${this.size.bounding.height}`);

  //     this.ref_ = ref_;
  //     this.ref_.append(...children_elements);
  //   }

  get ref(): SVGSVGElement {
    return this.ref_;
  }

  get parent(): Node<T, Key> | undefined {
    return this.parent_?.deref();
  }

  get children(): Node<T, Key>[] {
    return this.children_.map((c) => c[2]);
  }

  get vertical(): boolean {
    return this.vertical_;
  }

  set vertical(value: boolean) {
    if (this.vertical_ !== value) {
      this.vertical_ = value;
      this.requestSkeletonUpdate();
    }
  }

  get collapsed(): boolean {
    return this.collapsed_;
  }

  set collapsed(value: boolean) {
    if (this.collapsed_ !== value) {
      this.collapsed_ = value;
      this.requestSkeletonUpdate();
    }
  }

  get active(): boolean {
    return this.active_;
  }

  set active(value: boolean) {
    if (this.active_ !== value) {
      this.active_ = value;
      this.requestSkeletonUpdate();
    }
  }

  get hover(): boolean {
    return this.hover_;
  }

  set hover(value: boolean) {
    if (this.hover_ !== value) {
      this.hover_ = value;
      this.requestSkeletonUpdate();
    }
  }
}
