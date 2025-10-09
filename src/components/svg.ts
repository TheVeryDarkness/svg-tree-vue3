import type { Data, FontOptions, Options, Rectangle, TextSize, TextOptions, TreeNodeSize, Position, State, Size, ShapeOptions, Shape, Relative } from "./types";

/**
 * Saved properties for hot update
 */
class NodeBase<Key extends string | number | symbol = "path"> {
  protected name: string;
  protected color?: string;
  protected backgroundColor?: string;
  protected dashArray?: string | number;
  protected outSelfShape?: Shape;
  protected outSelfFill?: string;
  protected outColor?: string;
  protected inChildrenShape?: (Shape | undefined)[];
  protected inChildrenFill?: (string | undefined)[];
  protected extensible: boolean;

  protected fontFamily?: string;
  protected fontSize: number;
  protected fontWeight: number;

  protected radius: number;

  protected key?: string | number;

  protected keyProp: Key;

  protected vertical: boolean;
  protected collapsed: boolean;
  protected active: boolean;
  protected hover: boolean;

  protected static readonly extendTextContent = "+";

  protected constructor(
    name: string,
    color: string | undefined,
    backgroundColor: string | undefined,
    dashArray: string | number | undefined,
    outSelfShape: Shape | undefined,
    outSelfFill: string | undefined,
    outColor: string | undefined,
    inChildrenShape: (Shape | undefined)[] | undefined,
    inChildrenFill: (string | undefined)[] | undefined,
    extensible: boolean,
    fontFamily: string | undefined,
    fontSize: number,
    fontWeight: number,
    radius: number,
    key: string | number | undefined,
    keyProp: Key,
    vertical: boolean,
    collapsed: boolean,
    active: boolean,
    hover: boolean,
  ) {
    this.name = name;
    this.color = color;
    this.backgroundColor = backgroundColor;
    this.dashArray = dashArray;
    this.outSelfShape = outSelfShape;
    this.outSelfFill = outSelfFill;
    this.outColor = outColor;
    this.inChildrenShape = inChildrenShape;
    this.inChildrenFill = inChildrenFill;
    this.extensible = extensible;

    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.fontWeight = fontWeight;

    this.radius = radius;

    this.key = key;

    this.keyProp = keyProp;

    this.vertical = vertical;
    this.collapsed = collapsed;
    this.active = active;
    this.hover = hover;
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
  private children_: [SVGPathElement, SVGPathElement | null, Node<T, Key>][];
  private parent_?: Node<T, Key>;
  private extend: [SVGPathElement, SVGRectElement, SVGTextElement] | null;

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
    //     const { fontFamily, fontSize } = options.font;
    //     const { textWeight, textHoverWeight, textActiveWeight } = options.text;
    //     ctx.font = computeCtxFont(fontFamily, fontSize, textWeight);
    //     const textMetrics = ctx.measureText(this.ref.getAttribute("svg-name") || "");
    //     const textWidth = textMetrics.width;
    //     const textHeight = fontSize; // Approximate height using font size

    //     const paddingX = options.layout.paddingX;
    //     const paddingY = options.layout.paddingY;

    //     const boundingWidth = textWidth + paddingX * 2;
    //     const boundingHeight = textHeight + paddingY * 2;

    //     return {
    //       bounding: { width: boundingWidth, height: boundingHeight },
    //       name: { x: -boundingWidth / 2 + paddingX, y: -boundingHeight / 2 + paddingY, width: textWidth, height: textHeight },
    //     };
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

  private constructor(data: T, keyProp: Key, options: Options, ctx: OffscreenCanvasRenderingContext2D, parent?: Node<T, Key>) {
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
      data.backgroundColor ?? options.color.backgroundColor,
      data.dashArray,
      data.outSelfShape,
      data.outSelfFill,
      data.outColor ?? data.color ?? options.color.borderColor,
      data.inChildrenShape,
      data.inChildrenFill,
      extensible,
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

    const _ref = document.createElementNS("http://www.w3.org/2000/svg", "svg");

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

      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      shadow.classList.add("svg-tree-node-shadow-rect");
      shadow.setAttribute("x", String(rectPosition.x + 4));
      shadow.setAttribute("y", String(rectPosition.y + 4));
      shadow.setAttribute("width", String(rectPosition.width));
      shadow.setAttribute("height", String(rectPosition.height));
      shadow.setAttribute("rx", String(options.layout.radius));
      shadow.setAttribute("ry", String(options.layout.radius));
      this.shadow_rect = shadow;
      children_elements.push(shadow);

      this.text = Node.computeTextPosition(this.size.name, margin, padding, textSize);
    } else {
      this.shadow_rect = null;

      const out_shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
      out_shape.classList.add("svg-tree-node-out-shape");
      out_shape.style.fill = this.outSelfFill ?? "none";
      out_shape.style.strokeLinejoin = "round";
      this.out_shape = out_shape;
      children_elements.push(out_shape);

      const self = this;
      const children_nodes = typeof data.children === "function" ? data.children(data) : data.children;

      const children = children_nodes.map(function (data, index): [SVGPathElement, SVGPathElement | null, Node<T, Key>] {
        const child = new Node(data, keyProp, options, ctx, self);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.classList.add("svg-tree-node-link-path");
        if (self.outColor) path.style.color = self.outColor;
        path.style.fill = "none";
        if (self.dashArray) path.style.strokeDasharray = String(self.dashArray);
        // path.style.strokeLinejoin = "round";
        children_elements.push(path);

        let inShape: SVGPathElement | null = null;
        const inChildShape = self.inChildrenShape?.[index];
        const inChildFill = self.inChildrenFill?.[index];
        if (inChildShape) {
          inShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
          inShape.classList.add("svg-tree-node-in-shape");
          if (self.color) inShape.style.color = self.color;
          inShape.style.fill = inChildFill ?? "none";
          inShape.style.strokeLinejoin = "round";
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
        extend_path.classList.add("svg-tree-node-link-path");
        extend_path.style.fill = "none";
        if (this.outColor) extend_path.style.color = this.outColor;
        children_elements.push(extend_path);

        const extend_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        extend_rect.classList.add("svg-tree-node-rect");
        extend_rect.classList.add("svg-tree-node-extend-rect");
        extend_rect.style.boxSizing = "border-box";
        if (this.color) extend_rect.style.color = this.color;
        extend_rect.style.cursor = "pointer";
        if (this.backgroundColor) extend_rect.style.fill = this.backgroundColor;
        children_elements.push(extend_rect);

        const extend_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        extend_text.textContent = Node.extendTextContent;
        extend_text.classList.add("svg-tree-node-text");
        extend_text.classList.add("svg-tree-node-extend-text");
        extend_text.style.cursor = "pointer";
        if (this.color) extend_text.style.fill = this.color;
        if (this.fontFamily) extend_text.style.fontFamily = this.fontFamily;
        extend_text.style.fontSize = this.fontSize.toString();
        extend_text.style.fontWeight = this.fontWeight.toString();
        extend_text.style.userSelect = "none";
        children_elements.push(extend_text);

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
        this.collapsed,
        this.vertical,
      );
      const extendPosition = Node.computeTextPosition(extendSize.name, margin, padding, extendTextSize);
      const rectPosition = Node.computeRectPosition(
        this.children_.map((c) => c[2].size),
        extendSize,
        this.extensible,
        boundingSize,
        rectSize,
        margin,
        this.vertical,
        this.collapsed,
      );

      let outOffset = 0;
      if (this.outSelfShape) {
        const outShape = Node.computeOutShape(this.outSelfShape, options.shape, rectPosition, rectPosition.x + rectPosition.width / 2, margin, this.vertical);
        if (this.outColor) out_shape.style.color = this.outColor;
        out_shape.setAttribute("d", outShape[0]);
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
        this.vertical,
      );
      for (let i = 0; i < children.length; i++) {
        const [path, inShape, child] = children[i];
        const relative = relatives[0][i];
        path.setAttribute("d", relative.link);
        if (inShape && relative.in) {
          inShape.setAttribute("d", relative.in);
        }
        child.ref_.setAttribute("x", String(relative.left));
        child.ref_.setAttribute("y", String(relative.top));
      }
      if (this.extend && this.extensible) {
        const [extend_path, extend_rect, extend_text] = this.extend;
        const relative = relatives[1];
        extend_path.setAttribute("d", relative.link);
        extend_rect.setAttribute("x", String(relative.left + extendSize.name.x));
        extend_rect.setAttribute("y", String(relative.top + extendSize.name.y));
        extend_rect.setAttribute("width", String(extendSize.name.width));
        extend_rect.setAttribute("height", String(extendSize.name.height));
        extend_rect.setAttribute("rx", String(options.layout.radius));
        extend_rect.setAttribute("ry", String(options.layout.radius));

        extend_text.setAttribute("x", String(relative.left + extendPosition.x));
        extend_text.setAttribute("y", String(relative.top + extendPosition.y));
      }

      this.size = {
        bounding: boundingSize,
        name: rectPosition,
      };
      this.text = Node.computeTextPosition(this.size.name, margin, padding, textSize);
    }

    {
      const node_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      node_rect.classList.add("svg-tree-node-rect");
      node_rect.setAttribute("x", String(this.size.name.x));
      node_rect.setAttribute("y", String(this.size.name.y));
      node_rect.setAttribute("width", String(this.size.name.width));
      node_rect.setAttribute("height", String(this.size.name.height));
      node_rect.setAttribute("rx", String(options.layout.radius));
      node_rect.setAttribute("ry", String(options.layout.radius));
      if (this.color) node_rect.style.color = this.color;
      if (this.backgroundColor) node_rect.style.fill = this.backgroundColor;
      node_rect.style.boxSizing = "border-box";
      node_rect.style.cursor = "pointer";
      this.node_rect = node_rect;
      children_elements.push(node_rect);
    }

    {
      const node_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      node_text.textContent = this.name;
      node_text.classList.add("svg-tree-node-text");
      node_text.setAttribute("x", String(this.text.x));
      node_text.setAttribute("y", String(this.text.y));
      if (this.color) node_text.style.fill = this.color;
      node_text.style.userSelect = "none";
      if (this.fontFamily) node_text.style.fontFamily = this.fontFamily;
      node_text.style.fontSize = String(this.fontSize);
      node_text.style.fontWeight = String(this.fontWeight);
      node_text.style.cursor = "pointer";
      this.node_text = node_text;
      children_elements.push(node_text);
    }

    _ref.classList.add("svg-tree-node");

    _ref.setAttribute("enable-background", "true");
    _ref.style.fill = "none";
    _ref.setAttribute("svg-key", data[keyProp]?.toString() ?? "");

    _ref.setAttribute("width", String(this.size.bounding.width));
    _ref.setAttribute("height", String(this.size.bounding.height));
    _ref.setAttribute("viewBox", `0 0 ${this.size.bounding.width} ${this.size.bounding.height}`);

    // if (data.color) {
    //   _ref.setAttribute("stroke", data.color);
    //   _ref.setAttribute("color", data.color);
    // }
    // if (data.backgroundColor) {
    //   _ref.setAttribute("fill", data.backgroundColor);
    // }
    // if (data.dashArray) {
    //   _ref.setAttribute("stroke-dasharray", String(data.dashArray));
    // }
    // if (data.outSelfShape) {
    //   _ref.setAttribute("marker-end", `url(#${data.outSelfShape}-end)`);
    //   if (data.outSelfFill) {
    //     const fill = data.outSelfFill === "currentColor" ? "currentColor" : data.outSelfFill || "none";
    //     _ref.setAttribute("marker-end", `url(#${data.outSelfShape}-end-${fill.replace("#", "")})`);
    //   }
    // }
    // if (data.outColor) {
    //   const color = data.outColor === "currentColor" ? "currentColor" : data.outColor || data.color || "black";
    //   _ref.setAttribute("stroke", color);
    //   _ref.setAttribute("color", color);
    // }

    this.ref_ = _ref;
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

  update(data: T, keyProp: Key, options: Options, ctx: OffscreenCanvasRenderingContext2D) {
    // this.data = data;
    // this.keyProp = keyProp;
    // this.options = options;
    // this.ctx = ctx;
  }

  get ref(): SVGSVGElement {
    return this.ref_;
  }

  get parent(): Node<T, Key> | undefined {
    return this.parent_;
  }

  get children(): Node<T, Key>[] {
    return this.children_.map((c) => c[2]);
  }
}
