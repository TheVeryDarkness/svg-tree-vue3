import type { Data, Options, Rectangle, TextSize, TextOptions, TreeNodeSize, Position, State, Size, ShapeOptions, Shape, Relative } from "./types";

/**
 * Saved properties for hot update
 */
class NodeBase<Key extends string | number | symbol = "path"> {
  ctx: OffscreenCanvasRenderingContext2D;

  name: string;
  color?: string;
  textColor?: string;
  backgroundColor?: string;
  dashArray?: string | number;
  outSelfShape?: Shape;
  outSelfFill?: string;
  outColor?: string;
  inChildrenShape?: (Shape | undefined)[];
  inChildrenFill?: (string | undefined)[];
  extensible: boolean;

  shadowColor?: string;

  fontFamily?: string;
  fontSize: number;
  fontWeight: number;

  radius: number;
  padding: Position;
  indent: Position;
  margin: Position;
  shape: ShapeOptions;

  key?: string | number;

  keyProp: Key;

  vertical_: boolean;
  collapsed_: boolean;
  active_: boolean;
  hover_: boolean;

  static readonly extendTextContent = "+";

  protected constructor(
    ctx: OffscreenCanvasRenderingContext2D,
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
    padding: Position,
    indent: Position,
    margin: Position,
    shape: ShapeOptions,
    key: string | number | undefined,
    keyProp: Key,
    vertical_: boolean,
    collapsed_: boolean,
    active_: boolean,
    hover_: boolean,
  ) {
    this.ctx = ctx;
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
    this.padding = padding;
    this.indent = indent;
    this.margin = margin;
    this.shape = shape;

    this.key = key;

    this.keyProp = keyProp;

    this.vertical_ = vertical_;
    this.collapsed_ = collapsed_;
    this.active_ = active_;
    this.hover_ = hover_;
  }
  protected reset(
    ctx: OffscreenCanvasRenderingContext2D,
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
    padding: Position,
    indent: Position,
    margin: Position,
    shape: ShapeOptions,
    key: string | number | undefined,
    keyProp: Key,
    vertical_: boolean,
    collapsed_: boolean,
    active_: boolean,
    hover_: boolean,
  ) {
    this.ctx = ctx;
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
    this.padding = padding;
    this.indent = indent;
    this.margin = margin;
    this.shape = shape;

    this.key = key;

    this.keyProp = keyProp;

    this.vertical_ = vertical_;
    this.collapsed_ = collapsed_;
    this.active_ = active_;
    this.hover_ = hover_;
  }
}

type Node = [SVGRectElement, SVGTextElement];
type Child<T extends Data<T, Key>, Key extends string | number | symbol = "path"> = [SVGPathElement, SVGPathElement | null, TreeNode<T, Key>];
type Extend = [SVGPathElement, SVGRectElement, SVGTextElement];

/**
 * A virtual node class for SVG elements.
 */
export class TreeNode<T extends Data<T, Key>, Key extends string | number | symbol = "path"> extends NodeBase<Key> {
  private text: Position;
  private size: TreeNodeSize;

  private ref_: SVGSVGElement;
  private node: Node;
  private shadow: SVGRectElement | null;
  private out_shape: SVGPathElement | null;
  private children_: Child<T, Key>[];
  private parent_?: WeakRef<TreeNode<T, Key>>;
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

  private static setupOutShape(out_shape: SVGPathElement, outSelfFill: string | undefined, outColor: string | undefined, outPath: string) {
    out_shape.classList.add("link");
    out_shape.style.fill = outSelfFill ?? "none";
    out_shape.style.strokeLinejoin = "round";

    if (outColor) out_shape.style.color = outColor;
    out_shape.setAttribute("d", outPath);
  }

  private static setupChild<T extends Data<T, Key>, Key extends string | number | symbol = "path">(
    [path, inShape, child]: Child<T, Key>,
    inChildFill: string | undefined,
    outColor: string | undefined,
    dashArray: string | number | undefined,
    relative: Relative,
  ) {
    path.classList.add("link");
    if (outColor) path.style.color = outColor;
    path.style.fill = "none";
    if (dashArray) path.style.strokeDasharray = String(dashArray);
    // path.style.strokeLinejoin = "round";

    if (inShape) {
      inShape.classList.add("link");
      if (outColor) inShape.style.color = outColor;
      inShape.style.fill = inChildFill ?? "none";
      inShape.style.strokeLinejoin = "round";
    }

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

    extend_text.textContent = TreeNode.extendTextContent;
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

  private static setupRoot<T extends Data<T, Key>, Key extends string | number | symbol = "path">(ref_: SVGSVGElement, key: string | number | undefined, size: TreeNodeSize) {
    ref_.classList.add("svg-tree-node");

    ref_.setAttribute("enable-background", "true");
    ref_.style.fill = "none";
    ref_.setAttribute("svg-key", key?.toString() ?? "");

    ref_.setAttribute("width", String(size.bounding.width));
    ref_.setAttribute("height", String(size.bounding.height));
    ref_.setAttribute("viewBox", `0 0 ${size.bounding.width} ${size.bounding.height}`);
  }

  private static setup<T extends Data<T, Key>, Key extends string | number | symbol = "path">(
    {
      radius,
      outColor,
      outSelfFill,
      outSelfShape,
      inChildrenShape,
      inChildrenFill,
      dashArray,
      shadowColor,
      color,
      backgroundColor,
      textColor,
      fontSize,
      fontWeight,
      fontFamily,
    }: NodeBase<Key>,
    ctx: OffscreenCanvasRenderingContext2D,
    name: string,
    padding: Position,
    indent: Position,
    margin: Position,
    shape: ShapeOptions,
    ref_: SVGSVGElement,
    node: Node,
    shadow: SVGRectElement | null,
    out_shape: SVGPathElement | null,
    children_: Child<T, Key>[],
    extend: Extend | null,
    key: string | number | undefined,
    extensible: boolean,
    vertical_: boolean,
    collapsed_: boolean,
  ): [TreeNodeSize, Position] {
    const textSize = TreeNode.computeTextSize(ctx, name);
    const rectSize = TreeNode.computeRectSize(textSize, padding);
    const extendTextSize = TreeNode.computeExtendTextSize(ctx, TreeNode.extendTextContent);
    const extendRectSize = TreeNode.computeExtendRectSize(extendTextSize, padding);
    const extendSize = TreeNode.computeExtendSize(extendRectSize, margin);
    const boundingSize = TreeNode.computeSize(
      rectSize,
      indent,
      margin,
      children_.map((c) => c[2].size.bounding),
      extendSize.bounding,
      extensible,
      collapsed_,
      vertical_,
    );
    const extendPosition = TreeNode.computeTextPosition(extendSize.name, margin, padding, extendTextSize);
    const rectPosition = TreeNode.computeRectPosition(
      children_.map((c) => c[2].size),
      extendSize,
      extensible,
      boundingSize,
      rectSize,
      margin,
      vertical_,
      collapsed_,
    );

    let outOffset = 0;
    if (outSelfShape && out_shape) {
      const outShape = TreeNode.computeOutShape(outSelfShape, shape, rectPosition, rectPosition.x + rectPosition.width / 2, margin, vertical_);
      TreeNode.setupOutShape(out_shape, outSelfFill, outColor, outShape[0]);
      outOffset = outShape[1];
    }
    const relatives = TreeNode.computeChildrenRelatives(
      radius,
      shape,
      boundingSize,
      rectSize,
      indent,
      margin,
      outOffset,
      children_.map((c) => c[2].size),
      inChildrenShape,
      extendSize,
      extensible,
      vertical_,
    );

    for (const [index, [path, inShape, child]] of children_.entries()) {
      const inChildFill = inChildrenFill?.[index];

      const relative = relatives[0][index];
      TreeNode.setupChild([path, inShape, child], inChildFill, outColor, dashArray, relative);
    }

    if (shadow) {
      TreeNode.setupShadow(shadow, radius, rectPosition, shadowColor);
    }

    if (extend && extensible) {
      const relative = relatives[1];

      TreeNode.setupExtend(extend, color, backgroundColor, outColor, textColor, fontFamily, fontSize, fontWeight, relative, extendSize, extendPosition, radius);
    }

    const size = {
      bounding: boundingSize,
      name: rectPosition,
    };
    const text = TreeNode.computeTextPosition(size.name, margin, padding, textSize);

    TreeNode.setupSelf(node, size, text, name, color, backgroundColor, textColor, fontFamily, fontSize, fontWeight, radius);

    TreeNode.setupRoot(ref_, key, size);

    return [size, text];
  }

  private constructor(data: T, keyProp: Key, options: Options, ctx: OffscreenCanvasRenderingContext2D, parent?: WeakRef<TreeNode<T, Key>>) {
    const name = data.name;
    const collapsed = typeof data.children === "function";
    const vertical = true;
    const extensible = data.extensible ?? false;

    const { fontFamily, fontSize } = options.font;
    const active = false;
    const hover = false;
    const fontWeight = TreeNode.computeFontWeight(options.text, { active, hover });

    const { indentX, indentY, marginX, marginY, paddingX, paddingY } = options.layout;
    const indent = { x: indentX, y: indentY };
    const margin = { x: marginX, y: marginY };
    const padding = { x: paddingX, y: paddingY };

    super(
      ctx,
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
      padding,
      indent,
      margin,
      options.shape,
      data[keyProp],
      keyProp,
      vertical,
      collapsed,
      active,
      hover,
    );

    const ctxFont = TreeNode.computeCtxFont(fontFamily, fontSize, fontWeight);
    ctx.font = ctxFont;

    const ref_ = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    const children_elements: SVGElement[] = [];

    if (collapsed) {
      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      this.shadow = shadow;
      children_elements.push(shadow);
    } else {
      this.shadow = null;
    }

    const node_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const node_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    children_elements.push(node_rect, node_text);
    this.node = [node_rect, node_text];

    if (!collapsed && this.outSelfShape) {
      const out_shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.out_shape = out_shape;
      children_elements.push(out_shape);
    } else {
      this.out_shape = null;
    }

    let children_nodes: T[];

    if (collapsed) {
      this.children_ = [];
      this.extend = null;
      children_nodes = [];
    } else {
      const self = this;
      children_nodes = typeof data.children === "function" ? data.children(data) : data.children;
      const children = children_nodes.map(function (data, index): Child<T, Key> {
        const child = new TreeNode(data, keyProp, options, ctx, new WeakRef(self));

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        let inShape: SVGPathElement | null = null;
        const inChildShape = self.inChildrenShape?.[index];
        if (inChildShape) {
          inShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
        }

        return [path, inShape, child];
      }, this);
      this.children_ = children;
      for (const [path, inShape, child] of children) {
        children_elements.push(path);
        if (inShape) children_elements.push(inShape);
        children_elements.push(child.ref_);
      }
    }

    if (!collapsed && this.extensible) {
      const extend_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const extend_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const extend_text = document.createElementNS("http://www.w3.org/2000/svg", "text");

      children_elements.push(extend_path, extend_rect, extend_text);

      this.extend = [extend_path, extend_rect, extend_text];
    } else {
      this.extend = null;
    }

    this.ref_ = ref_;
    this.parent_ = parent;
    this.ref_.append(...children_elements);

    const [size, text] = TreeNode.setup(
      this,
      ctx,
      name,
      padding,
      indent,
      margin,
      options.shape,
      ref_,
      this.node,
      this.shadow,
      this.out_shape,
      this.children_,
      this.extend,
      this.key,
      extensible,
      vertical,
      collapsed,
    );
    this.size = size;
    this.text = text;
  }

  static create<T extends Data<T, Key>, Key extends string | number | symbol = "path">(
    data: T,
    keyProp: Key,
    options: Options,
    ctx: OffscreenCanvasRenderingContext2D,
  ): TreeNode<T, Key> {
    return new TreeNode(data, keyProp, options, ctx);
  }

  private static sizeDiffer(a: Size, b: Size): boolean {
    return a.width !== b.width || a.height !== b.height;
  }

  scrollIntoView(behavior: ScrollBehavior = "smooth", block: ScrollLogicalPosition = "center", inline: ScrollLogicalPosition = "center") {
    this.ref_.scrollIntoView({ behavior, block, inline });
  }

  protected requestSkeletonUpdate() {
    let cur = this.parent;
    while (cur) {
      if (!cur.recomputeStyle()) break;
      cur = cur.parent;
    }
  }
  protected recomputeStyle() {
    const padding = { x: this.padding.x, y: this.padding.y };
    const indent = { x: this.indent.x, y: this.indent.y };
    const margin = { x: this.margin.x, y: this.margin.y };

    const [size, text] = TreeNode.setup(
      this,
      this.ctx,
      this.name,
      padding,
      indent,
      margin,
      this.shape,
      this.ref_,
      this.node,
      this.shadow,
      this.out_shape,
      this.children_,
      this.extend,
      this.key,
      this.extensible,
      this.vertical,
      this.collapsed,
    );

    const skeletonChanged = TreeNode.sizeDiffer(this.size.bounding, size.bounding);
    this.size = size;
    this.text = text;

    return skeletonChanged;
  }

  fullUpdate(data: T, keyProp: Key, options: Options, ctx: OffscreenCanvasRenderingContext2D) {
    const name = data.name;
    const collapsed = this.collapsed_; // typeof data.children === "function";
    const vertical = this.vertical_; // true;
    const extensible = data.extensible ?? false;

    const { fontFamily, fontSize } = options.font;
    const active = false;
    const hover = false;
    const fontWeight = TreeNode.computeFontWeight(options.text, { active, hover });

    super.reset(
      ctx,
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
      { x: options.layout.paddingX, y: options.layout.paddingY },
      { x: options.layout.indentX, y: options.layout.indentY },
      { x: options.layout.marginX, y: options.layout.marginY },
      options.shape,
      data[keyProp],
      keyProp,
      vertical,
      collapsed,
      active,
      hover,
    );

    if (this.shadow === null && collapsed) {
      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      this.ref_.insertBefore(shadow, this.ref_.firstChild);
      this.shadow = shadow;
    } else if (this.shadow !== null && !collapsed) {
      this.ref_.removeChild(this.shadow);
      this.shadow = null;
    }

    if (this.extend === null && !collapsed && this.extensible) {
      const extend_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const extend_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const extend_text = document.createElementNS("http://www.w3.org/2000/svg", "text");

      this.ref_.appendChild(extend_path);
      this.ref_.appendChild(extend_rect);
      this.ref_.appendChild(extend_text);

      this.extend = [extend_path, extend_rect, extend_text];
    } else if (this.extend !== null && (collapsed || !this.extensible)) {
      const [extend_path, extend_rect, extend_text] = this.extend;
      this.ref_.removeChild(extend_path);
      this.ref_.removeChild(extend_rect);
      this.ref_.removeChild(extend_text);
      this.extend = null;
    }

    if (this.out_shape === null && !collapsed && this.outSelfShape) {
      const out_shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.ref_.insertBefore(out_shape, this.node[0]);
      this.out_shape = out_shape;
    } else if (this.out_shape !== null && (collapsed || !this.outSelfShape)) {
      this.ref_.removeChild(this.out_shape);
      this.out_shape = null;
    }

    const children = this.collapsed_ ? [] : typeof data.children === "function" ? data.children(data) : data.children;
    if (!this.collapsed_) {
      // Update existing children and add new ones
      const minLength = Math.min(this.children_.length, children.length);
      for (let i = 0; i < minLength; i++) {
        const child = this.children_[i];
        let inChildShape = this.inChildrenShape?.[i];
        if (!this.inChildrenShape && child[1]) {
          this.ref_.removeChild(child[1]);
          child[1] = null;
        } else if (inChildShape && !child[1]) {
          const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
          this.ref_.insertBefore(shape, child[0]);
          child[1] = shape;
        }
        this.children_[i][2].fullUpdate(children[i], keyProp, options, ctx);
      }
      if (children.length > this.children_.length) {
        // Add new children
        const self = this;
        const newChildren = children.slice(this.children_.length).map(function (data, index): Child<T, Key> {
          const child = new TreeNode(data, keyProp, options, ctx, new WeakRef(self));

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

          let inShape: SVGPathElement | null = null;
          const inChildShape = self.inChildrenShape?.[self.children_.length + index];
          if (inChildShape) {
            inShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
          }

          return [path, inShape, child];
        }, this);
        this.children_.push(...newChildren);
        for (const [path, inShape, child] of newChildren) {
          this.ref_.appendChild(path);
          if (inShape) this.ref_.appendChild(inShape);
          this.ref_.appendChild(child.ref_);
        }
      } else if (children.length < this.children_.length) {
        // Remove excess children
        const toRemove = this.children_.slice(children.length);
        for (const [path, inShape, child] of toRemove) {
          this.ref_.removeChild(path);
          if (inShape) this.ref_.removeChild(inShape);
          this.ref_.removeChild(child.ref_);
        }
        this.children_ = this.children_.slice(0, children.length);
      }
    } else {
      // If now collapsed, remove all children from DOM
      for (const [path, inShape, child] of this.children_) {
        this.ref_.removeChild(path);
        if (inShape) this.ref_.removeChild(inShape);
        this.ref_.removeChild(child.ref_);
      }
      this.children_ = [];
    }

    const skeletonChanged = this.recomputeStyle();

    if (skeletonChanged) {
      this.requestSkeletonUpdate();
    }
  }

  get ref(): SVGSVGElement {
    return this.ref_;
  }

  get parent(): TreeNode<T, Key> | undefined {
    return this.parent_?.deref();
  }

  get children(): TreeNode<T, Key>[] {
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
    if (!this.collapsed_ && this.children_.length === 0) {
      // Cannot collapse a non-collapsed node without children
      return;
    }
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
