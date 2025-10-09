<template>
  <svg
    ref="_svg"
    :view-box="viewBox"
    :width="width"
    :height="height"
    class="svg-tree-node"
    :class="{ hover, active, inactive: hasActive && !active, normal: !hasActive }"
    enable-background="true"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
  >
    <!-- Shadow part -->
    <rect class="shadow" :x="rect.x + 4" :y="rect.y + 4" :rx="radius" :width="rect.width" :height="rect.height" v-if="collapsed" />

    <!-- Self part -->
    <rect
      class="node"
      :x="rect.x"
      :y="rect.y"
      :rx="radius"
      :width="rect.width"
      :height="rect.height"
      :style="rectStyle"
      cursor="pointer"
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
      @click="emit('click', event($event))"
      @dblclick="emit('dblclick', event($event))"
      @contextmenu="emit('contextmenu', event($event))"
    />
    <text
      ref="_name"
      class="node"
      :x="text.x"
      :y="text.y"
      :style="textStyle"
      cursor="pointer"
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
      @click="emit('click', event($event))"
      @dblclick="emit('dblclick', event($event))"
      @contextmenu="emit('contextmenu', event($event))"
    >
      {{ node.name }}
    </text>
    <!-- <rect :width="width" :height="height" stroke="red" fill="none" /> -->

    <!-- Out part -->
    <path v-if="!collapsed" :fill="props.node.outSelfFill ?? 'none'" class="link" stroke-linejoin="round" :style="outStyle" :d="out?.[0]" />

    <!-- Children part -->
    <tree-node
      v-for="(value, index) of node.children"
      v-if="!collapsed"
      ref="children"
      :node="value"
      :key="index"
      :ctx="ctx"
      :options="options"
      :label-key="props.labelKey"
      v-bind:state="state"
      :x="relative[index]?.left"
      :y="relative[index]?.top"
      :class="{ collapsed }"
      @click="emit('click', $event)"
      @dblclick="emit('dblclick', $event)"
      @active="emit('active', $event)"
      @contextmenu="emit('contextmenu', $event)"
    ></tree-node>
    <path
      v-for="(_, index) of node.children"
      v-if="!collapsed"
      :key="index"
      fill="none"
      :style="outStyle"
      class="link"
      :d="relative[index]?.link"
      :stroke-dasharray="node.dashArray"
    />
    <path
      v-for="(_, index) of node.children"
      v-if="!collapsed"
      :key="index"
      :fill="props.node.inChildrenFill?.[index] ?? 'none'"
      :style="outStyle"
      class="link"
      stroke-linejoin="round"
      :d="relative[index]?.in"
    />

    <!-- Extend part -->
    <path v-if="!collapsed && node.extensible" fill="none" class="link extend" :style="outStyle" :d="extend.link" />
    <rect
      v-if="!collapsed && node.extensible"
      :x="extendRect.x"
      :y="extendRect.y"
      :rx="radius"
      :width="extendNodeSize.name.width"
      :height="extendNodeSize.name.height"
      :style="rectStyle"
      class="node extend"
      cursor="pointer"
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
    />
    <text
      v-if="!collapsed && node.extensible"
      :x="extendText.x"
      :y="extendText.y"
      :style="textStyle"
      class="node extend"
      cursor="pointer"
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
    >
      {{ extendTextContent }}
    </text>

    <!-- <rect
      v-if="!collapsed && node.extensible"
      :x="extend.left"
      :y="extend.top"
      :width="extendNodeSize.bounding.width"
      :height="extendNodeSize.bounding.height"
      stroke="red"
      fill="none"
    /> -->
  </svg>
</template>
<script setup lang="ts" generic="T extends Data<T, Key>, Key extends string | number | symbol = 'path'">
import { computed, ref, StyleValue, useTemplateRef, watch } from "vue";
import type { Data, ExternalState, Options, Rectangle, Shape, TreeEvent, TreeNodeSize } from "./types";

// Props.
const props = defineProps<{
  node: T;
  ctx: OffscreenCanvasRenderingContext2D;
  options: Options;
  state: ExternalState;
  labelKey: Key;
  parent?: T;
}>();

// The key of the node, used for identification.
const key = computed(() => props.node[props.labelKey]);

// Emits.
type Emits = {
  click: [TreeEvent<T, MouseEvent>];
  dblclick: [TreeEvent<T, MouseEvent>];
  active: [TreeEvent<T, string | number | undefined>];
  contextmenu: [TreeEvent<T, MouseEvent>];
  mouseenter: [TreeEvent<T, MouseEvent>];
  mouseleave: [TreeEvent<T, MouseEvent>];
};
const emit = defineEmits<Emits>();

// Options.
const { indentX, indentY, marginY, marginX, paddingY, paddingX, radius } = props.options.layout;
const { textWeight, textHoverWeight, textActiveWeight } = props.options.text;
const { fontFamily, fontSize } = props.options.font;

const svg = useTemplateRef<SVGElement>("_svg");
const name = useTemplateRef<SVGTextElement>("_name");
/**
 * @description Indicates whether the node is vertical.
 *
 * - If true, the node is displayed vertically, And the children are arranged below it.
 * - If false, the node is displayed horizontally, And the children are arranged to the right of it.
 */
const vertical = ref<boolean>(true);
const collapsed = ref<boolean>(typeof props.node.children === "function");
const active = ref<boolean>(false);
const hover = ref<boolean>(false);
const children = ref<{ size: TreeNodeSize }[]>([]);

watch(
  () => props.node,
  (newNode) => {
    if (typeof newNode.children === "function") {
      collapsed.value = true;
    }
  },
);

const hasActive = ref(false);

const fontWeight = computed(function (): number {
  return active.value ? textActiveWeight : hover.value ? textHoverWeight : textWeight;
});

const ctxFont = computed(() => `${fontWeight.value} ${fontSize}px ${fontFamily}`);

const textStyle = computed(function (): StyleValue {
  return {
    fill: props.node.color ?? undefined,
    userSelect: "none",
    fontWeight: fontWeight.value,
    fontFamily,
    fontSize,
  };
});

const outStyle = computed(function (): StyleValue {
  return {
    color: props.node.outColor ?? props.node.color ?? undefined,
  };
});

const rectStyle = computed(function (): StyleValue {
  return {
    color: props.node.color ?? undefined,
    fill: props.node.backgroundColor ?? undefined,
    boxSizing: "border-box",
  };
});

// Track the size of each node.

function event<E>(event: E): TreeEvent<T, E> {
  // console.log(width.value, height.value, sizes.value);
  return { event, node: props.node, scrollIntoView, setCollapsed, setVertical, getCollapsed, getVertical };
}

function mouseenter($event: MouseEvent) {
  props.state.hover.value = key.value;
  hover.value = true;
  emit("mouseenter", event($event));
}
function mouseleave($event: MouseEvent) {
  props.state.hover.value = undefined;
  hover.value = false;
  emit("mouseleave", event($event));
}

const sizes = computed(function (): TreeNodeSize[] {
  return children.value.map((child) => child.size);
});

// Some constants or variables for size calculation.

const extendTextContent = "+";

const extendTextSize = computed(function () {
  props.ctx.font = ctxFont.value;
  const metrics = props.ctx.measureText(extendTextContent);
  const width = metrics.width;
  const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  const baselineOffsetY = metrics.fontBoundingBoxAscent;
  return { width, height, baselineOffsetY };
});

const extendNodeSize = computed(function (): TreeNodeSize {
  return {
    bounding: { width: extendTextSize.value.width + paddingX * 2 + marginX * 2, height: extendTextSize.value.height + paddingY * 2 + marginY * 2 },
    name: {
      x: marginX,
      y: marginY,
      width: extendTextSize.value.width + paddingX * 2,
      height: extendTextSize.value.height + paddingY * 2,
    },
  };
});

/**
 * The size of the text area.
 */
const textSize = computed(function () {
  props.ctx.font = ctxFont.value;
  const metrics = props.ctx.measureText(props.node.name);
  const width = metrics.width;
  const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  const baselineOffsetY = metrics.fontBoundingBoxAscent;
  return { width, height, baselineOffsetY };
});

const rectWidth = computed(() => textSize.value.width + paddingX * 2);
const rectHeight = computed(() => textSize.value.height + paddingY * 2);

const widths = computed(() => {
  const widths = sizes.value.map((size) => size.bounding.width);
  if (props.node.extensible) widths.push(extendNodeSize.value.bounding.width);
  return widths;
});

const heights = computed(() => {
  const heights = sizes.value.map((size) => size.bounding.height);
  if (props.node.extensible) heights.push(extendNodeSize.value.bounding.height);
  return heights;
});

const width = computed(function () {
  if (collapsed.value) return rectWidth.value + marginX * 2;
  if (vertical.value) {
    return Math.max(
      widths.value.reduce((acc, cur) => Math.max(acc, cur + rectWidth.value / 2 + indentX + marginX), rectWidth.value + marginX * 2),
      rectWidth.value + marginX * 2,
    );
  } else {
    return Math.max(widths.value.reduce((acc, cur) => acc + cur, 0) - Math.max(0, widths.value.length - 1) * marginX, rectWidth.value + marginX * 2);
  }
});

const height = computed(function () {
  if (collapsed.value) return rectHeight.value + marginY * 2;
  if (vertical.value) {
    return marginY + rectHeight.value + heights.value.reduce((acc, cur) => acc + cur, 0) + (heights.value.length === 0 ? marginY : -(heights.value.length - 1) * marginY);
  } else {
    return marginY + rectHeight.value + indentY + heights.value.reduce((acc, cur) => Math.max(acc, cur), 0);
  }
});

const childrenWidth = computed(function () {
  if (vertical.value) {
    return 0;
  } else {
    return widths.value.reduce((acc, cur) => acc + cur, 0) - Math.max(0, sizes.value.length - 1) * marginX;
  }
});

const middle = computed(function () {
  const first = sizes.value.length > 0 ? sizes.value[0] : extendNodeSize.value;
  const last = props.node.extensible ? extendNodeSize.value : sizes.value.length > 0 ? sizes.value[sizes.value.length - 1] : extendNodeSize.value;
  const leftFirst = Math.max(0, width.value - childrenWidth.value) / 2;
  const firstMiddleX = first.name.x + first.name.width / 2;
  const lastMiddleX = childrenWidth.value - last.bounding.width + last.name.x + last.name.width / 2;
  const middle = leftFirst + (lastMiddleX + firstMiddleX) / 2;
  return Math.max(Math.min(middle, width.value - (rectWidth.value / 2 + marginX)), rectWidth.value / 2 + marginX);
});

const out = computed(function (): [string, number] | undefined {
  const [x1, y1] = vertical.value ? [marginX + rectWidth.value / 2, marginY + rectHeight.value] : [middle.value, marginY + rectHeight.value];
  const shape = props.node.outSelfShape;

  const offset = 1;

  switch (shape) {
    case "arrow": {
      const { width, length } = props.options.shape.arrow;
      return [
        `M ${x1 - width / 2} ${y1 + length + offset}
l ${width / 2} ${-length}
l ${width / 2} ${length}
`,
        offset,
      ];
    }
    case "circle": {
      const { width, length } = props.options.shape.circle;
      return [
        `M ${x1} ${y1 + offset}
a ${width / 2} ${length / 2} 0.5 1 1 0 ${length}
a ${width / 2} ${length / 2} 0.5 1 1 0 ${-length}
`,
        length + offset,
      ];
    }
    case "diamond": {
      const { width, length } = props.options.shape.diamond;
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
      const { width, length } = props.options.shape.triangle;
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
});

type Relative = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  link: string;
  in?: string;
};
const relatives = computed(function (): [Relative[], Relative] {
  const offset = 1;
  if (vertical.value) {
    const cur = {
      left: marginX + rectWidth.value / 2 + indentX,
      top: marginY + rectHeight.value,
    };
    function next(value: TreeNodeSize, shape?: Shape): Relative {
      const left = cur.left;
      const top = cur.top;
      const right = left + value.bounding.width;
      const bottom = top + value.bounding.height;

      const x1 = marginX + rectWidth.value / 2;
      const y1 = marginY + rectHeight.value + (out.value === undefined ? 0 : out.value[1]);
      const x2 = x1;
      const y2 = top + value.name.y + value.name.height / 2;
      const dx3 = indentX + value.name.x;
      function inShapes(shape?: Shape): [string, number] | undefined {
        switch (shape) {
          case "arrow": {
            const { width, length } = props.options.shape.arrow;
            return [
              `M ${x2 + dx3 - length - offset} ${y2 - width / 2}
l ${length} ${width / 2}
l ${-length} ${width / 2}`,
              offset,
            ];
          }
          case "circle": {
            const { width, length } = props.options.shape.circle;
            return [
              `M ${x2 + dx3 - length - offset} ${y2}
a ${length / 2} ${width / 2} 0.5 1 1 ${length} 0
a ${length / 2} ${width / 2} 0.5 1 1 ${-length} 0
Z`,
              length + offset,
            ];
          }
          case "diamond": {
            const { width, length } = props.options.shape.diamond;
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
            const { width, length } = props.options.shape.triangle;
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
      cur.top = bottom - marginY;
      return { left, top, right, bottom, link, in: inShape?.[0] };
    }
    const results = sizes.value.map((value, i) => next(value, props.node.inChildrenShape?.[i]));
    const e = next(extendNodeSize.value);
    return [results, e];
  } else {
    const cur = {
      left: Math.max(0, width.value - childrenWidth.value) / 2,
      top: marginY + rectHeight.value + indentY,
    };
    function next(value: TreeNodeSize, shape?: Shape): Relative {
      const left = cur.left;
      const top = cur.top;
      const right = left + value.bounding.width;
      const bottom = top + value.bounding.height;
      const x1 = middle.value;
      const y1 = marginY + rectHeight.value + (out.value?.[1] ?? 0);
      const dy2 = indentY - (out.value?.[1] ?? 0);
      const x3 = cur.left + value.name.x + value.name.width / 2;
      // const dx3 = x3 - x1
      const y3 = cur.top;
      const dy4 = value.name.y;
      function inShapes(shape?: Shape): [string, number] | undefined {
        switch (shape) {
          case "arrow": {
            const { width, length } = props.options.shape.arrow;
            return [
              `M ${x3 + width / 2} ${y3 + dy4 - length - offset}
l ${-width / 2} ${length}
l ${-width / 2} ${-length}`,
              offset,
            ];
          }
          case "circle": {
            const { width, length } = props.options.shape.arrow;
            return [
              `M ${x3} ${y3 + dy4 - length - offset}
a ${width / 2} ${length / 2} 0.5 1 1 0 ${length}
a ${width / 2} ${length / 2} 0.5 1 1 0 ${-length}
Z`,
              length + offset,
            ];
          }
          case "diamond": {
            const { width, length } = props.options.shape.diamond;
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
            const { width, length } = props.options.shape.triangle;
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
      cur.left = right - marginX;
      return { left, top, right, bottom, link, in: inShape?.[0] };
    }
    const results = sizes.value.map((value, i) => next(value, props.node.inChildrenShape?.[i]));
    const e = next(extendNodeSize.value);
    return [results, e];
  }
});
const relative = computed(() => relatives.value[0]);
const extend = computed(() => relatives.value[1]);

const extendText = computed(function () {
  return {
    x: extend.value.left + marginX + paddingX,
    y: extend.value.top + marginY + paddingY + extendTextSize.value.baselineOffsetY,
  };
});

const extendRect = computed(function () {
  return {
    x: extend.value.left + marginX,
    y: extend.value.top + marginY,
    width: extendNodeSize.value.name.width,
    height: extendNodeSize.value.name.height,
  };
});

const viewBox = computed(() => `0 0 ${width.value} ${height.value}`);

const rect = computed(function () {
  if ((sizes.value.length === 0 && !props.node.extensible) || collapsed.value) {
    return {
      x: marginX,
      y: marginY,
      width: rectWidth.value,
      height: rectHeight.value,
    };
  } else if (vertical.value) {
    return {
      x: marginX,
      y: marginY,
      width: rectWidth.value,
      height: rectHeight.value,
    };
  } else {
    return {
      x: middle.value - rectWidth.value / 2,
      y: marginY,
      width: rectWidth.value,
      height: rectHeight.value,
    };
  }
});

const text = computed(function () {
  if (vertical.value)
    return {
      x: marginX + paddingX,
      y: marginY + textSize.value.baselineOffsetY + paddingY,
    };
  else
    return {
      x: rect.value.x + paddingX,
      y: marginY + textSize.value.baselineOffsetY + paddingY,
    };
});

const size = computed(function (): TreeNodeSize {
  const name: Rectangle = rect.value;
  return { bounding: { width: width.value, height: height.value }, name };
});

function scrollIntoView() {
  setTimeout(() =>
    name.value?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    }),
  );
}

function getCollapsed() {
  return collapsed.value;
}
function getVertical() {
  return vertical.value;
}
function setCollapsed(collapsed_?: boolean) {
  const newCollapsed = collapsed_ ?? !collapsed.value;
  if (newCollapsed === collapsed.value) return;
  if (newCollapsed) {
    if (props.node.children instanceof Array && props.node.children.length === 0) {
      return; // Do not collapse if there are no children.
    }
  } else {
    if (typeof props.node.children === "function") {
      props.node.children = props.node.children(props.node);
    }
  }
  collapsed.value = newCollapsed;
}
function setVertical(vertical_?: boolean) {
  vertical.value = vertical_ ?? !vertical.value;
}

defineExpose({
  getBoundingClientRect: svg.value?.getBoundingClientRect,
  scrollIntoView,
  getCollapsed,
  getVertical,
  setCollapsed,
  setVertical,
  size,
  svg,
});

// Watch external states.
function watchActive(_active: string | number | undefined) {
  hasActive.value = _active !== undefined;
  // console.log('active', active, props.node.path)
  if ((active.value = !!_active && key.value === _active)) {
    // console.log("scroll", active, props.node.path);
    // console.log(name.value);
    emit("active", event(_active));
  }
}

function watchHover(_hover: string | number | undefined) {
  // console.log("hover", _hover, key.value, props.node, props.labelKey);
  hover.value = _hover !== undefined && key.value === _hover;
}

watch(props.state.active, watchActive);
watch(props.state.hover, watchHover);

// // Click event handler.
// let lastClick: TreeEvent<T, MouseEvent> | undefined = undefined;

// function click($event: TreeEvent<T, MouseEvent>) {
//   $event.event.stopPropagation();
//   function noModifierKeys(event: MouseEvent) {
//     return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
//   }
//   function onlyPrimaryButton(event: MouseEvent) {
//     return event.button === 0; // Left mouse button.
//   }
//   if (props.options.control.dblclick > 0 && noModifierKeys($event.event) && onlyPrimaryButton($event.event)) {
//     if (lastClick) {
//       if (Date.now() - lastClick.event.timeStamp < props.options.control.dblclick) {
//         // Double click.
//         lastClick = undefined;
//         return emit("dblclick", $event);
//       } else {
//         // Single click.
//         emit("click", $event);
//       }
//     } else {
//       // Single click.
//       lastClick = $event;
//     }
//   } else {
//     return emit("click", $event);
//   }
// }
</script>
