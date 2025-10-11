import {
  Data,
  Rectangle,
  TextSize,
  TreeNodeSize,
  Position,
  Size,
  ShapeOptions,
  Shape,
  Relative,
  PartialOptions,
  createContext,
  mergeOptions,
  defaultOptions,
  schemeMatcher,
  mergeColorOptions,
  ColorOptions,
  mergeShapeOptions,
  Children,
} from "./types";

type UUID = number;

/**
 * Saved properties for hot update
 */
class NodeBase<T extends Data<Key>, Key extends string | number | symbol = "path"> {
  protected ctx: OffscreenCanvasRenderingContext2D;
  protected data_: T;
  protected options: PartialOptions;
  protected keyProp: Key;

  private key_: string | number | undefined;

  private vertical_: boolean;
  private collapsed_: boolean;
  private active_: boolean;
  private hasActive_: boolean;
  private hover_: boolean;

  protected static readonly extendTextContent = "+";

  protected constructor(
    ctx: OffscreenCanvasRenderingContext2D,
    data: T,
    options: PartialOptions,
    keyProp: Key,
    vertical_: boolean,
    collapsed_: boolean,
    active_: boolean,
    has_active_: boolean,
    hover_: boolean,
  ) {
    this.ctx = ctx;
    this.data_ = data;
    this.options = options;
    this.keyProp = keyProp;

    this.key_ = this.data_[this.keyProp];

    this.vertical_ = vertical_;
    this.collapsed_ = collapsed_;
    this.active_ = active_;
    this.hasActive_ = has_active_;
    this.hover_ = hover_;
  }
  protected reset(
    ctx: OffscreenCanvasRenderingContext2D,
    data: T,
    options: PartialOptions,
    keyProp: Key,
    vertical_: boolean,
    collapsed_: boolean,
    active_: boolean,
    hover_: boolean,
  ) {
    this.ctx = ctx;
    this.data_ = data;
    this.options = options;
    this.keyProp = keyProp;

    this.key_ = this.data_[this.keyProp];

    this.vertical_ = vertical_;
    this.collapsed_ = collapsed_;
    this.active_ = active_;
    this.hover_ = hover_;
  }

  protected get data(): Data<Key> {
    return this.data_;
  }
  protected get key(): string | number | undefined {
    return this.key_;
  }
  protected get name(): string {
    return this.data_.name;
  }

  protected get extensible(): boolean {
    return this.data_.extensible ?? false;
  }

  protected get radius() {
    return this.options?.layout?.radius ?? defaultOptions.layout.radius;
  }

  protected get shape(): ShapeOptions {
    return mergeShapeOptions(this.options?.shape);
  }

  protected get borderColor(): string | undefined {
    return this.data_?.color ?? defaultOptions.color.borderColor;
  }
  protected get textColor(): string | undefined {
    return this.data_?.color ?? (this.active ? defaultOptions.color.textActiveColor : this.hover ? defaultOptions.color.textHoverColor : defaultOptions.color.textColor);
  }
  protected get backgroundColor(): string | undefined {
    return this.data_?.backgroundColor ?? defaultOptions.color.backgroundColor;
  }
  protected get dashArray(): string | number | undefined {
    return this.data_.dashArray;
  }
  protected get outSelfShape(): Shape | undefined {
    return this.data_.outSelfShape;
  }
  protected get outSelfFill(): string | undefined {
    return this.data_.outSelfFill;
  }
  protected get outColor(): string | undefined {
    return this.data_.outColor ?? this.data_.color ?? this.options?.color?.borderColor ?? defaultOptions.color.borderColor;
  }
  protected get inChildrenShape(): (Shape | undefined)[] | undefined {
    return this.data_.inChildrenShape;
  }
  protected get inChildrenFill(): (string | undefined)[] | undefined {
    return this.data_.inChildrenFill;
  }
  protected get shadowColor(): string | undefined {
    return this.options?.color?.shadowColor ?? defaultOptions.color.shadowColor;
  }
  protected get textWeight(): number {
    return this.options?.text?.textWeight ?? defaultOptions.text.textWeight;
  }
  protected get textHoverWeight(): number {
    return this.options?.text?.textHoverWeight ?? defaultOptions.text.textHoverWeight;
  }
  protected get textActiveWeight(): number {
    return this.options?.text?.textActiveWeight ?? defaultOptions.text.textActiveWeight;
  }
  protected get fontWeight(): number {
    return this.active_ ? this.textActiveWeight : this.hover_ ? this.textHoverWeight : this.textWeight;
  }
  protected get fontSize(): number {
    return this.options?.font?.fontSize ?? defaultOptions.font.fontSize;
  }
  protected get fontFamily(): string | undefined {
    return this.options?.font?.fontFamily ?? defaultOptions.font.fontFamily;
  }

  protected get padding(): Position {
    return {
      x: this.options?.layout?.paddingX ?? defaultOptions.layout.paddingX,
      y: this.options?.layout?.paddingY ?? defaultOptions.layout.paddingY,
    };
  }
  protected get indent(): Position {
    return {
      x: this.options?.layout?.indentX ?? defaultOptions.layout.indentX,
      y: this.options?.layout?.indentY ?? defaultOptions.layout.indentY,
    };
  }
  protected get margin(): Position {
    return {
      x: this.options?.layout?.marginX ?? defaultOptions.layout.marginX,
      y: this.options?.layout?.marginY ?? defaultOptions.layout.marginY,
    };
  }

  protected get collapsed(): boolean {
    return this.collapsed_;
  }
  protected get active(): boolean {
    return this.active_;
  }
  protected get hasActive(): boolean {
    return this.hasActive_;
  }
  protected get hover(): boolean {
    return this.hover_;
  }
  protected get vertical(): boolean {
    return this.vertical_;
  }
  protected set collapsed(value: boolean) {
    this.collapsed_ = value;
  }
  protected set active(value: boolean) {
    this.active_ = value;
  }
  protected set hasActive(value: boolean) {
    this.hasActive_ = value;
  }
  protected set hover(value: boolean) {
    this.hover_ = value;
  }
  protected set vertical(value: boolean) {
    this.vertical_ = value;
  }
}

type Node = [SVGRectElement, SVGTextElement];
type Child<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path"> = [SVGPathElement, SVGPathElement | null, TreeNode<T, Key>];
type Extend = [SVGPathElement, SVGRectElement, SVGTextElement];

/**
 * A virtual node class for SVG elements.
 */
export class TreeNode<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path"> extends NodeBase<T, Key> {
  // private text: Position;
  private size: TreeNodeSize;

  private uuid_: number;
  private manager: Manager<T, Key>;

  private ref_: SVGSVGElement;
  private node: Node;
  private shadow: SVGRectElement | null;
  private out_shape: SVGPathElement | null;
  private children_: Child<T, Key>[];
  private parent_?: WeakRef<TreeNode<T, Key>>;
  private extend: Extend | null;

  private static computeCtxFont(fontFamily: string | undefined, fontSize: number, fontWeight: number): string {
    return `${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  /**
   * Compute the size of the text using the provided canvas context and font settings.
   */
  private static computeTextSize(ctx: OffscreenCanvasRenderingContext2D, text: string, ctxFont: string): TextSize {
    ctx.font = ctxFont;
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
  private static computeExtendTextSize(ctx: OffscreenCanvasRenderingContext2D, text: string, ctxFont: string): TextSize {
    ctx.font = ctxFont;
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
    if (collapsed) {
      const width = rectSize.width + margin.x * 2;
      const height = rectSize.height + margin.y * 2;
      return {
        width,
        height,
      };
    }
    if (vertical) {
      const width = Math.max(
        all.reduce((acc, cur) => Math.max(acc, cur.width + rectSize.width / 2 + indent.x + margin.x), rectSize.width + margin.x * 2),
        rectSize.width + margin.x * 2,
      );
      const height = margin.y + rectSize.height + all.reduce((acc, cur) => acc + cur.height, 0) + (all.length === 0 ? margin.y : -(all.length - 1) * margin.y);
      return {
        width,
        height,
      };
    } else {
      const width = Math.max(all.reduce((acc, cur) => acc + cur.width, 0) - Math.max(0, all.length - 1) * margin.x, rectSize.width + margin.x * 2);
      const height = margin.y + rectSize.height + indent.y + all.reduce((acc, cur) => Math.max(acc, cur.height), 0);
      return {
        width,
        height,
      };
    }
  }

  /**
   * Compute the total width of all child nodes including margins.
   *
   * *Horizontal layout only*.
   */
  private static computeChildrenWidth(all: TreeNodeSize[], marginX: number): number {
    return all.reduce((acc, cur) => acc + cur.bounding.width, 0) - Math.max(0, all.length - 1) * marginX;
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
    const lastMiddleX = childrenWidth - last.bounding.width + last.name.x + last.name.width / 2;
    const middle = leftFirst + (lastMiddleX + firstMiddleX) / 2;
    // console.log({ all, width, first, last, childrenWidth, leftFirst, firstMiddleX, lastMiddleX, middle });
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
              const { width, length } = options.circle;
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

  private static setupShadow(shadow: SVGRectElement, radius: number, rectPosition: Rectangle, shadowColor: string | undefined, uuid: UUID) {
    shadow.classList.add("shadow");
    if (shadowColor) shadow.style.fill = shadowColor;
    shadow.setAttribute("x", String(rectPosition.x + 4));
    shadow.setAttribute("y", String(rectPosition.y + 4));
    shadow.setAttribute("width", String(rectPosition.width));
    shadow.setAttribute("height", String(rectPosition.height));
    shadow.setAttribute("rx", String(radius));
    shadow.setAttribute("ry", String(radius));
    shadow.setAttribute("svg-uuid", String(uuid));
  }

  private static setupOutShape(out_shape: SVGPathElement, outSelfFill: string | undefined, outColor: string | undefined, outPath: string, uuid: UUID) {
    out_shape.classList.add("link");
    out_shape.style.fill = outSelfFill ?? "none";
    out_shape.style.strokeLinejoin = "round";
    // out_shape.style.vectorEffect = "non-scaling-stroke";

    if (outColor) out_shape.style.color = outColor;
    out_shape.setAttribute("d", outPath);
    out_shape.setAttribute("svg-uuid", String(uuid));
  }

  private static setupChild<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path">(
    [path, inShape, child]: Child<T, Key>,
    inChildFill: string | undefined,
    outColor: string | undefined,
    dashArray: string | number | undefined,
    relative: Relative,
    uuid: UUID,
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
    path.setAttribute("svg-uuid", String(uuid));

    if (inShape) {
      if (relative.in) {
        inShape.setAttribute("d", relative.in);
      }
      inShape.setAttribute("svg-uuid", String(uuid));
    }

    child.ref_.setAttribute("x", String(relative.left));
    child.ref_.setAttribute("y", String(relative.top));
  }

  private static setupExtend(
    [extend_path, extend_rect, extend_text]: Extend,
    borderColor: string | undefined,
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
    uuid: UUID,
  ) {
    extend_path.classList.add("link", "extend");
    extend_path.style.fill = "none";
    if (outColor) extend_path.style.color = outColor;
    extend_path.style.strokeLinejoin = "round";
    // extend_path.style.vectorEffect = "non-scaling-stroke";
    extend_path.setAttribute("d", relative.link);
    extend_path.setAttribute("svg-uuid", String(uuid));

    extend_rect.classList.add("rect", "extend");
    extend_rect.style.boxSizing = "border-box";
    if (borderColor) extend_rect.style.color = borderColor;
    extend_rect.style.cursor = "pointer";
    if (backgroundColor) extend_rect.style.fill = backgroundColor;
    extend_rect.setAttribute("x", String(relative.left + extendSize.name.x));
    extend_rect.setAttribute("y", String(relative.top + extendSize.name.y));
    extend_rect.setAttribute("width", String(extendSize.name.width));
    extend_rect.setAttribute("height", String(extendSize.name.height));
    extend_rect.setAttribute("rx", String(radius));
    extend_rect.setAttribute("ry", String(radius));
    extend_rect.setAttribute("svg-uuid", String(uuid));

    extend_text.textContent = TreeNode.extendTextContent;
    extend_text.classList.add("text", "extend");
    extend_text.style.cursor = "pointer";
    if (textColor) extend_text.style.fill = textColor;
    if (fontFamily) extend_text.style.fontFamily = fontFamily;
    extend_text.style.fontSize = fontSize.toString();
    extend_text.style.fontWeight = fontWeight.toString();
    extend_text.style.userSelect = "none";
    extend_text.setAttribute("x", String(relative.left + extendPosition.x));
    extend_text.setAttribute("y", String(relative.top + extendPosition.y));
    extend_text.setAttribute("svg-uuid", String(uuid));
  }

  private static setupSelf(
    [node_rect, node_text]: [SVGRectElement, SVGTextElement],
    size: TreeNodeSize,
    text: Position,
    name: string,
    borderColor: string | undefined,
    backgroundColor: string | undefined,
    textColor: string | undefined,
    fontFamily: string | undefined,
    fontSize: number,
    fontWeight: number,
    radius: number,
    uuid: UUID,
  ) {
    node_rect.classList.add("rect", "node");
    node_rect.setAttribute("x", String(size.name.x));
    node_rect.setAttribute("y", String(size.name.y));
    node_rect.setAttribute("width", String(size.name.width));
    node_rect.setAttribute("height", String(size.name.height));
    node_rect.setAttribute("rx", String(radius));
    node_rect.setAttribute("ry", String(radius));
    if (borderColor) node_rect.style.color = borderColor;
    if (backgroundColor) node_rect.style.fill = backgroundColor;
    node_rect.style.boxSizing = "border-box";
    node_rect.style.cursor = "pointer";
    node_rect.setAttribute("svg-uuid", String(uuid));

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
    node_text.setAttribute("svg-uuid", String(uuid));
  }

  private static setupRoot(ref_: SVGSVGElement, key: string | number | undefined, size: TreeNodeSize, active: boolean, hasActive: boolean) {
    ref_.classList.add("svg-tree-node");
    if (active) {
      ref_.classList.add("active");
      ref_.classList.remove("inactive", "normal");
    } else if (hasActive) {
      ref_.classList.add("inactive");
      ref_.classList.remove("active", "normal");
    } else {
      ref_.classList.add("normal");
      ref_.classList.remove("active", "inactive");
    }

    ref_.setAttribute("enable-background", "true");
    ref_.style.fill = "none";
    ref_.setAttribute("svg-key", key?.toString() ?? "");
    // ref_.setAttribute("svg-uuid", uuid.toString());

    ref_.setAttribute("width", String(size.bounding.width));
    ref_.setAttribute("height", String(size.bounding.height));
    ref_.setAttribute("viewBox", `0 0 ${size.bounding.width} ${size.bounding.height}`);
  }

  private static setup<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path">(
    {
      radius,
      outColor,
      outSelfFill,
      outSelfShape,
      inChildrenShape,
      inChildrenFill,
      dashArray,
      shadowColor,
      borderColor,
      backgroundColor,
      textColor,
      padding,
      indent,
      margin,
      shape,
      fontSize,
      fontWeight,
      fontFamily,
    }: TreeNode<T, Key>,
    ctx: OffscreenCanvasRenderingContext2D,
    name: string,
    ref: SVGSVGElement,
    node: Node,
    shadow: SVGRectElement | null,
    out_shape: SVGPathElement | null,
    children: Child<T, Key>[],
    extend: Extend | null,
    key: string | number | undefined,
    extensible: boolean,
    vertical: boolean,
    collapsed: boolean,
    active: boolean,
    hasActive: boolean,
    uuid: number,
  ): [TreeNodeSize, Position] {
    const ctxFont = TreeNode.computeCtxFont(fontFamily, fontSize, fontWeight);
    const textSize = TreeNode.computeTextSize(ctx, name, ctxFont);
    const rectSize = TreeNode.computeRectSize(textSize, padding);
    const extendTextSize = TreeNode.computeExtendTextSize(ctx, TreeNode.extendTextContent, ctxFont);
    const extendRectSize = TreeNode.computeExtendRectSize(extendTextSize, padding);
    const extendSize = TreeNode.computeExtendSize(extendRectSize, margin);
    const boundingSize = TreeNode.computeSize(
      rectSize,
      indent,
      margin,
      children.map((c) => c[2].size.bounding),
      extendSize.bounding,
      extensible,
      collapsed,
      vertical,
    );
    const extendPosition = TreeNode.computeTextPosition(extendSize.name, margin, padding, extendTextSize);
    const rectPosition = TreeNode.computeRectPosition(
      children.map((c) => c[2].size),
      extendSize,
      extensible,
      boundingSize,
      rectSize,
      margin,
      vertical,
      collapsed,
    );

    let outOffset = 0;
    if (outSelfShape && out_shape) {
      const outShape = TreeNode.computeOutShape(outSelfShape, shape, rectPosition, rectPosition.x + rectPosition.width / 2, margin, vertical);
      TreeNode.setupOutShape(out_shape, outSelfFill, outColor, outShape[0], uuid);
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
      children.map((c) => c[2].size),
      inChildrenShape,
      extendSize,
      extensible,
      vertical,
    );

    for (const [index, [path, inShape, child]] of children.entries()) {
      const inChildFill = inChildrenFill?.[index];

      const relative = relatives[0][index];
      TreeNode.setupChild([path, inShape, child], inChildFill, outColor, dashArray, relative, uuid);
    }

    if (shadow) {
      TreeNode.setupShadow(shadow, radius, rectPosition, shadowColor, uuid);
    }

    if (extend && extensible) {
      const relative = relatives[1];

      TreeNode.setupExtend(extend, borderColor, backgroundColor, outColor, textColor, fontFamily, fontSize, fontWeight, relative, extendSize, extendPosition, radius, uuid);
    }

    const size = {
      bounding: boundingSize,
      name: rectPosition,
    };
    const text = TreeNode.computeTextPosition(size.name, margin, padding, textSize);

    TreeNode.setupSelf(node, size, text, name, borderColor, backgroundColor, textColor, fontFamily, fontSize, fontWeight, radius, uuid);

    TreeNode.setupRoot(ref, key, size, active, hasActive);

    return [size, text];
  }

  private constructor(data: T, keyProp: Key, options: PartialOptions, ctx: OffscreenCanvasRenderingContext2D, manager: Manager<T, Key>, parent?: WeakRef<TreeNode<T, Key>>) {
    const name = data.name;
    const collapsed = typeof data.children === "function";
    const vertical = true;
    const extensible = data.extensible ?? false;

    const active = false;
    const hasActive = false;
    const hover = false;

    super(ctx, data, options, keyProp, vertical, collapsed, active, hasActive, hover);

    this.uuid_ = manager.next();
    this.manager = manager;

    const ctxFont = TreeNode.computeCtxFont(this.fontFamily, this.fontSize, this.fontWeight);
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
      if (typeof data.children === "function") {
        data.children = data.children(data);
      }
      children_nodes = data.children;
      const children = children_nodes.map(function (data, index): Child<T, Key> {
        const child = new TreeNode(data, keyProp, options, ctx, manager, new WeakRef(self));

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

    const [size, _] = TreeNode.setup(
      this,
      ctx,
      name,
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
      active,
      hasActive,
      this.uuid_,
    );
    this.size = size;
    // this.text = text;

    manager.add(this);
  }

  static create<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path">(
    data: T,
    keyProp: Key,
    options: PartialOptions,
    ctx: OffscreenCanvasRenderingContext2D,
    manager: Manager<T, Key>,
  ): TreeNode<T, Key> {
    return new TreeNode(data, keyProp, options, ctx, manager);
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
    const [size, _] = TreeNode.setup(
      this,
      this.ctx,
      this.name,
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
      this.active,
      this.hasActive,
      this.uuid_,
    );

    const skeletonChanged = TreeNode.sizeDiffer(this.size.bounding, size.bounding);
    this.size = size;
    // this.text = text;

    return skeletonChanged;
  }

  fullUpdate(data: T = this.data_, keyProp: Key = this.keyProp, options: PartialOptions = this.options, ctx: OffscreenCanvasRenderingContext2D = this.ctx) {
    const collapsed = this.collapsed; // typeof data.children === "function";
    const vertical = this.vertical; // true;

    const active = this.active;
    const hover = this.hover;

    super.reset(ctx, data, options, keyProp, vertical, collapsed, active, hover);

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

    const children = this.collapsed ? [] : typeof data.children === "function" ? (data.children = data.children(data)) : data.children;
    if (!this.collapsed) {
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
          const child = new TreeNode(data, keyProp, options, ctx, self.manager, new WeakRef(self));

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

  updateColor(options: ColorOptions) {
    const collapsed = this.collapsed;
    const vertical = this.vertical;
    const active = this.active;
    const hover = this.hover;

    if (!this.options) this.options = { color: options };
    else {
      this.options.color = options;
    }

    super.reset(this.ctx, this.data_, this.options, this.keyProp, vertical, collapsed, active, hover);

    for (const [, , child] of this.children_) {
      child.updateColor(options);
    }

    const skeletonChanged = this.recomputeStyle();

    if (skeletonChanged) {
      console.warn("Skeleton changed during color update, this should not happen.");
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
  get prevSibling(): TreeNode<T, Key> | undefined {
    const parent = this.parent;
    if (parent) {
      const siblings = parent.children;
      let index = siblings.indexOf(this);
      if (index === -1) {
        console.error("Inconsistent state: parent does not contain this child");
        return undefined;
      }
      index = (index + siblings.length - 1) % siblings.length;
      return siblings[index];
    }
  }
  get nextSibling(): TreeNode<T, Key> | undefined {
    const parent = this.parent;
    if (parent) {
      const siblings = parent.children;
      let index = siblings.indexOf(this);
      if (index === -1) {
        console.error("Inconsistent state: parent does not contain this child");
        return undefined;
      }
      index = (index + 1) % siblings.length;
      return siblings[index];
    }
  }

  get key(): string | number | undefined {
    return super.key;
  }
  get uuid(): number {
    return this.uuid_;
  }

  setVertical(value: boolean = !super.vertical) {
    if (super.vertical === value) return;
    super.vertical = value;
    this.fullUpdate();
  }
  setCollapsed(value: boolean = !super.collapsed) {
    if (!super.collapsed && this.children_.length === 0 && !this.extensible) {
      // Cannot collapse a non-collapsed node without children
      return;
    }
    if (super.collapsed !== value) {
      super.collapsed = value;
      this.fullUpdate();
    }
  }
  setActive(active: boolean = !super.active, hasActive: boolean = active) {
    if (super.hasActive === hasActive && super.active === active) return;
    super.hasActive = hasActive;
    super.active = active;
    this.fullUpdate();
  }
  setHover(value: boolean = !super.hover) {
    if (super.hover === value) return;
    super.hover = value;
    this.fullUpdate();
  }

  /**
   * The original data object used to create this node.
   *
   * Use for reference only, do not modify.
   */
  get data() {
    return super.data;
  }
  get collapsed(): boolean {
    return super.collapsed;
  }
  get active(): boolean {
    return super.active;
  }
  get hasActive(): boolean {
    return super.hasActive;
  }
  get hover(): boolean {
    return super.hover;
  }
  get vertical(): boolean {
    return super.vertical;
  }
}

class Manager<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path"> {
  private current = 0;
  readonly nodes = new Map<string | number | undefined, WeakRef<TreeNode<T, Key>>[]>();
  readonly nodesByUUID = new Map<number, WeakRef<TreeNode<T, Key>>>();

  add(node: TreeNode<T, Key>) {
    const nodeRef = new WeakRef(node);
    if (!this.nodes.has(node.key)) this.nodes.set(node.key, []);
    this.nodes.get(node.key)?.push(nodeRef);
    if (this.nodesByUUID.has(node.uuid)) {
      console.error("UUID collision detected, this should not happen.");
    }
    this.nodesByUUID.set(node.uuid, nodeRef);
  }
  remove(node: TreeNode<T, Key>) {
    const nodeRef = new WeakRef(node);

    const nodes = this.nodes.get(node.key);
    if (nodes) {
      const index = nodes.indexOf(nodeRef);
      if (index !== -1) {
        nodes.splice(index, 1);
        if (nodes.length === 0) {
          this.nodes.delete(node.key);
        }
      }
    }
    this.nodesByUUID.delete(node.uuid);
  }

  next() {
    return this.current++;
  }

  findNodeByUUID(uuid: number): TreeNode<T, Key> | undefined {
    return this.nodesByUUID.get(uuid)?.deref();
  }
  findNodesByKey(key: string | number | undefined): TreeNode<T, Key>[] {
    if (key === undefined) return [];
    const nodes = this.nodes.get(key);
    if (!nodes) return [];
    return nodes.map((ref) => ref.deref()).filter((ref) => ref !== undefined);
  }

  getEventTarget(e: Event): [TreeNode<T, Key>, number] | undefined {
    const target = e.target;
    if (!(target instanceof SVGElement)) {
      // console.warn("Event target is not an SVGElement");
      return;
    }
    const uuid_string = target.attributes.getNamedItem("svg-uuid")?.value;
    if (!uuid_string) {
      // console.log("Event target does not have a svg-uuid attribute", target);
      return;
    }
    const uuid = Number(uuid_string);
    if (isNaN(uuid)) {
      // console.error("Invalid UUID");
      return;
    }
    const node = this.findNodeByUUID(uuid);
    if (!node) {
      // console.error("Node not found for UUID:", uuid);
      return;
    }
    return [node, uuid];
  }
}

interface EventMap<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path"> {
  active: { node: TreeNode<T, Key>[]; key: string | number | undefined; uuid: number[] };
  click: { node?: TreeNode<T, Key>; originalEvent: MouseEvent; uuid?: number };
  contextmenu: { node?: TreeNode<T, Key>; originalEvent: MouseEvent; uuid?: number };
  keydown: { node: TreeNode<T, Key>; originalEvent: KeyboardEvent; uuid: number };
  mouseenter: { node: TreeNode<T, Key>; originalEvent: MouseEvent; uuid: number };
  mouseleave: { node: TreeNode<T, Key>; originalEvent: MouseEvent; uuid: number };
}
export type EventKind<K extends keyof EventMap<T, Key>, T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path"> = EventMap<T, Key>[K];
function event<K extends keyof EventMap<T, Key>, T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path">(
  type: K,
  detail: EventKind<K, T, Key>,
): CustomEvent<EventKind<K, T, Key>> {
  return new CustomEvent<EventKind<K, T, Key>>(type, { detail });
}

export class Tree<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path"> {
  private readonly root_: TreeNode<T, Key>;
  private options_: PartialOptions;
  private readonly manager = new Manager<T, Key>();
  private readonly eventTarget = new EventTarget();
  private activeKey_: string | number | undefined = undefined;

  private watchScheme() {
    const options_ = mergeColorOptions(this.options_?.color);
    this.root_.updateColor(options_);
  }

  constructor(data: T, keyProp: Key, options?: PartialOptions, ctx?: OffscreenCanvasRenderingContext2D) {
    const options_ = mergeOptions(options);
    schemeMatcher.addEventListener("change", () => this.watchScheme());
    const ctx_ = ctx ?? createContext(new OffscreenCanvas(0, 0));
    this.root_ = TreeNode.create(data, keyProp, options_, ctx_, this.manager);
    this.options_ = options_;

    for (const type of ["click", "contextmenu"] as const) {
      this.root_.ref.addEventListener(type, (e) => {
        const target = this.manager.getEventTarget(e);
        if (!target) {
          this.eventTarget.dispatchEvent(event<typeof type, T, Key>(type, { originalEvent: e }));
          return;
        }
        const [node, uuid] = target;
        this.eventTarget.dispatchEvent(event<typeof type, T, Key>(type, { node, originalEvent: e, uuid }));
      });
    }
    for (const type of ["mouseover", "mouseout"] as const) {
      this.root_.ref.addEventListener(type, (e) => {
        const target = this.manager.getEventTarget(e);
        if (!target) return;
        const [node, uuid] = target;
        node.setHover(type === "mouseover");
        const eventType = type === "mouseover" ? "mouseenter" : "mouseleave";
        this.eventTarget.dispatchEvent(event<typeof eventType, T, Key>(eventType, { node, originalEvent: e, uuid }));
      });
    }
  }

  update(data?: T, keyProp?: Key, options?: PartialOptions, ctx?: OffscreenCanvasRenderingContext2D) {
    const options_ = options;
    this.options_ = options_;
    this.root_.fullUpdate(data, keyProp, options, ctx);
  }

  setActiveNode(node: TreeNode<T, Key> | undefined) {
    const hasActive = node !== undefined;
    for (const node_ of this.manager.nodes.values()) {
      const derefNode = node_[0]?.deref();
      if (derefNode) derefNode.setActive(derefNode === node, hasActive);
    }

    this.activeKey_ = node?.key;
    this.eventTarget.dispatchEvent(event<"active", T, Key>("active", { node: node ? [node] : [], key: node?.key, uuid: node ? [node.uuid] : [] }));
  }
  setActiveKey(key: string | number | undefined) {
    if (this.activeKey_ === key) return;
    const prevActiveNodes = this.manager.findNodesByKey(this.activeKey_);
    const newActiveNodes = this.manager.findNodesByKey(key);
    const hasActive = newActiveNodes.length > 0;
    for (const node of prevActiveNodes) {
      node.setActive(false, hasActive);
    }
    for (const node of newActiveNodes) {
      node.setActive(true, hasActive);
    }

    this.activeKey_ = key;
    this.eventTarget.dispatchEvent(event<"active", T, Key>("active", { node: newActiveNodes, key, uuid: newActiveNodes.map((n) => n.uuid) }));
  }
  get activeKey(): string | number | undefined {
    return this.activeKey_;
  }

  addEventListener<K extends keyof EventMap<T, Key>>(
    type: K,
    listener: (this: Tree<T, Key>, ev: CustomEvent<EventMap<T, Key>[K]>) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    this.eventTarget.addEventListener(type, <EventListener>listener, options);
  }
  removeEventListener<K extends keyof EventMap<T, Key>>(
    type: K,
    listener: (this: Tree<T, Key>, ev: CustomEvent<EventMap<T, Key>[K]>) => any,
    options?: boolean | EventListenerOptions,
  ) {
    this.eventTarget.removeEventListener(type, <EventListener>listener, options);
  }

  mountTo(element: HTMLElement) {
    element.appendChild(this.root_.ref);
  }

  unmountFrom(element: HTMLElement) {
    element.removeChild(this.root_.ref);
  }

  /**
   * Get the root SVG element of the tree.
   *
   * This is intended for saving purposes. Do not modify the returned SVG element directly.
   */
  get svg(): SVGSVGElement {
    return this.root_.ref;
  }
}

export class Forest<T extends Data<Key> & Children<T>, Key extends string | number | symbol = "path"> {
  private readonly roots_: TreeNode<T, Key>[];
  private options_: PartialOptions;
  private keyProp_: Key;
  private readonly manager = new Manager<T, Key>();
  private readonly eventTarget = new EventTarget();
  private activeKey_: string | number | undefined = undefined;

  private watchScheme() {
    const options_ = mergeColorOptions(this.options_?.color);
    for (const root of this.roots_) {
      root.updateColor(options_);
    }
  }

  constructor(data: T[], keyProp: Key, options?: PartialOptions, ctx?: OffscreenCanvasRenderingContext2D) {
    const options_ = mergeOptions(options);
    schemeMatcher.addEventListener("change", () => this.watchScheme());
    const ctx_ = ctx ?? createContext(new OffscreenCanvas(0, 0));
    this.roots_ = data.map((item) => TreeNode.create(item, keyProp, options_, ctx_, this.manager));
    this.options_ = options_;
    this.keyProp_ = keyProp;

    for (const root of this.roots_) {
      for (const type of ["click", "contextmenu"] as const) {
        root.ref.addEventListener(type, (e) => {
          const target = this.manager.getEventTarget(e);
          if (!target) {
            this.eventTarget.dispatchEvent(event<typeof type, T, Key>(type, { originalEvent: e }));
            return;
          }
          const [node, uuid] = target;
          this.eventTarget.dispatchEvent(event<typeof type, T, Key>(type, { node, originalEvent: e, uuid }));
        });
      }
      for (const type of ["mouseover", "mouseout"] as const) {
        root.ref.addEventListener(type, (e) => {
          const target = this.manager.getEventTarget(e);
          if (!target) return;
          const [node, uuid] = target;
          node.setHover(type === "mouseover");
          const eventType = type === "mouseover" ? "mouseenter" : "mouseleave";
          this.eventTarget.dispatchEvent(event<typeof eventType, T, Key>(eventType, { node, originalEvent: e, uuid }));
        });
      }
      for (const type of ["keydown"] as const) {
        root.ref.addEventListener(type, (e) => {
          const target = this.manager.getEventTarget(e);
          if (!target) return;
          const [node, uuid] = target;
          this.eventTarget.dispatchEvent(event<typeof type, T, Key>(type, { node, originalEvent: e, uuid }));
        });
      }
    }
  }

  update(data?: T[], keyProp?: Key, options?: PartialOptions, ctx?: OffscreenCanvasRenderingContext2D) {
    const options_ = options;
    this.options_ = options_;
    if (data && data.length !== this.roots_.length) {
      // Recreate all roots if the number of roots has changed
      for (const root of this.roots_) {
        root.ref.remove();
      }
      this.roots_.length = 0;
      for (const item of data) {
        this.roots_.push(TreeNode.create<T, Key>(item, keyProp ?? this.keyProp_, options_, ctx ?? createContext(new OffscreenCanvas(0, 0)), this.manager));
      }
    }
  }

  setActiveNode(node: TreeNode<T, Key> | undefined) {
    const hasActive = node !== undefined;
    for (const node_ of this.manager.nodes.values()) {
      const derefNode = node_[0]?.deref();
      if (derefNode) derefNode.setActive(derefNode === node, hasActive);
    }

    this.activeKey_ = node?.key;
    this.eventTarget.dispatchEvent(event<"active", T, Key>("active", { node: node ? [node] : [], key: node?.key, uuid: node ? [node.uuid] : [] }));
  }
  setActiveKey(key: string | number | undefined) {
    if (this.activeKey_ === key) return;
    const newActiveNodes = this.manager.findNodesByKey(key);
    const hasActive = newActiveNodes.length > 0;
    for (const node of this.manager.nodes.values()) {
      const derefNode = node[0]?.deref();
      if (derefNode) derefNode.setActive(derefNode.key === key, hasActive);
    }

    this.activeKey_ = key;
    this.eventTarget.dispatchEvent(event<"active", T, Key>("active", { node: newActiveNodes, key, uuid: newActiveNodes.map((n) => n.uuid) }));
  }
  get activeKey(): string | number | undefined {
    return this.activeKey_;
  }

  addEventListener<K extends keyof EventMap<T, Key>>(
    type: K,
    listener: (this: Tree<T, Key>, ev: CustomEvent<EventMap<T, Key>[K]>) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    this.eventTarget.addEventListener(type, <EventListener>listener, options);
  }
  removeEventListener<K extends keyof EventMap<T, Key>>(
    type: K,
    listener: (this: Tree<T, Key>, ev: CustomEvent<EventMap<T, Key>[K]>) => any,
    options?: boolean | EventListenerOptions,
  ) {
    this.eventTarget.removeEventListener(type, <EventListener>listener, options);
  }

  mountTo(element: HTMLElement) {
    for (const root of this.roots_) element.appendChild(root.ref);
  }

  unmountFrom(element: HTMLElement) {
    for (const root of this.roots_) element.removeChild(root.ref);
  }

  /**
   * Get the root SVG element of the tree.
   *
   * This is intended for saving purposes. Do not modify the returned SVG element directly.
   */
  get svg(): SVGSVGElement[] {
    return this.roots_.map((root) => root.ref);
  }
}
