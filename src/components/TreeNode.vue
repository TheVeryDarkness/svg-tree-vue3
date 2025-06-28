<template>
  <svg
    ref="svg"
    :view-box="viewBox"
    :width="width"
    :height="height"
    :class="{ hover, active, inactive: hasActive && !active, normal: !hasActive }"
    enable-background="true"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
  >
    <rect class="shadow" :x="rect.x + 4" :y="rect.y + 4" :rx="radius" :width="rect.width" :height="rect.height" v-if="collapsed" />
    <rect
      class="node"
      :x="rect.x"
      :y="rect.y"
      :rx="radius"
      :width="rect.width"
      :height="rect.height"
      :style="rectStyle"
      cursor="pointer"
      drag-scroller-disable
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
      @click="emit('click', event($event))"
      @contextmenu="emit('contextmenu', event($event))"
    />
    <text
      ref="name"
      class="node"
      :x="text.x"
      :y="text.y"
      :style="textStyle"
      cursor="pointer"
      drag-scroller-disable
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
      @click="emit('click', event($event))"
      @contextmenu="emit('contextmenu', event($event))"
    >
      {{ node.name }}
    </text>
    <!-- <rect :width="width" :height="height" stroke="red" fill="none" /> -->
    <!-- <line :x1="sizes[0]?.name?.x ?? 0 + (sizes[0]?.name?.width ?? 0) / 2" :y1="paddingY"
            :x2="sizes.reduce((acc, cur) => acc + (cur?.bounding?.width ?? 0), 0) - (sizes[sizes.length - 1]?.bounding?.width ?? 0) + (sizes[sizes.length - 1]?.name?.x ?? 0) + (sizes[sizes.length - 1]?.name?.width ?? 0) / 2"
            :y2="paddingY" stroke="green" /> -->
    <!-- :x="rectWidth / 2 + indentX" :y="(1 + index) * (fontSize.height + paddingY * 2 + gapY * 2)" -->
    <path v-if="!collapsed" :fill="props.node.outSelfFill ?? 'none'" class="link" stroke-linejoin="round" :d="out?.[0]" />
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
      @contextmenu="emit('contextmenu', $event)"
    ></tree-node>
    <path v-for="(_, index) of node.children" v-if="!collapsed" :key="index" fill="none" class="link" :d="relative[index]?.link" :stroke-dasharray="node.dashArray" />
    <path
      v-for="(_, index) of node.children"
      v-if="!collapsed"
      :key="index"
      :fill="props.node.inChildrenFill?.[index] ?? 'none'"
      class="link"
      stroke-linejoin="round"
      :d="relative[index]?.in"
    />
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
      drag-scroller-disable
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
      drag-scroller-disable
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
    >
      {{ extendTextContent }}
    </text>
    <path v-if="!collapsed && node.extensible" fill="none" class="link extend" :d="extend.link" />
    <!-- <rect v-if="!collapsed && node.extensible" :x="extend.left" :y="extend.top"
            :width="extendNodeSize.bounding.width" :height="extendNodeSize.bounding.height" stroke="red" fill="none" /> -->
  </svg>
</template>
<script setup lang="ts" generic="T extends Data<T, Key>, Key extends string | number | symbol = 'path'">
import { computed, ref, StyleValue, watch } from "vue";
import type { Data, ExternalState, Options, Rectangle, Shape, TreeEvent, TreeNodeSize } from "./types";

// Props.
const props = defineProps<{
  node: T;
  ctx: OffscreenCanvasRenderingContext2D;
  options: Options;
  state: ExternalState;
  labelKey: Key;
}>();

// The key of the node, used for identification.
const key = computed(() => props.node[props.labelKey]);

// Emits.
type Emits = {
  click: [TreeEvent<T, MouseEvent>];
  contextmenu: [TreeEvent<T, MouseEvent>];
  mouseenter: [TreeEvent<T, MouseEvent>];
  mouseleave: [TreeEvent<T, MouseEvent>];
};
const emit = defineEmits<Emits>();

// Options.
const { indentX, indentY, marginY, marginX, paddingY, paddingX, radius } = props.options.layout;
const { textWeight, textHoverWeight, textActiveWeight } = props.options.color;
const { fontFamily, fontSize } = props.options.font;

const svg = ref<SVGElement>();
const name = ref<SVGTextElement>();
const vertical = ref<boolean>(true);
const collapsed = ref<boolean>(false);
const active = ref<boolean>(false);
const hover = ref<boolean>(false);
const children = ref<{ size: TreeNodeSize }[]>([]);

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

const rectStyle = computed(function (): StyleValue {
  return {
    fill: props.node.backgroundColor ?? undefined,
  };
});

// Track the size of each node.

function event<E extends MouseEvent>(event: E) {
  // console.log(width.value, height.value, sizes.value);
  return { event, node: props.node, state: { vertical, collapsed }, scrollIntoView };
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

const width = computed(function () {
  const extendNodeWidth = props.node.extensible ? extendNodeSize.value.bounding.width : 0;
  if (vertical.value) {
    return Math.max(
      sizes.value.reduce((acc, cur) => Math.max(acc, cur.bounding.width + rectWidth.value / 2 + indentX), rectWidth.value + marginX * 2),
      extendNodeWidth + rectWidth.value / 2 + indentX,
    );
  } else {
    return Math.max(
      sizes.value.reduce((acc, cur) => acc + cur.bounding.width, extendNodeWidth),
      rectWidth.value + marginX * 2,
    );
  }
});

const height = computed(function () {
  const extendNodeHeight = props.node.extensible ? extendNodeSize.value.bounding.height : 0;
  if ((sizes.value.length === 0 && !props.node.extensible) || collapsed.value) {
    return rectHeight.value + marginY * 2;
  } else if (vertical.value) {
    return sizes.value.reduce((acc, cur) => acc + cur.bounding.height, rectHeight.value + marginY + extendNodeHeight);
  } else {
    return rectHeight.value + marginY + indentY + sizes.value.reduce((acc, cur) => Math.max(acc, cur.bounding.height), extendNodeHeight);
  }
});

const childrenWidth = computed(function () {
  if ((sizes.value.length === 0 && !props.node.extensible) || vertical.value) {
    return 0;
  } else {
    const extendNodeWidth = props.node.extensible ? extendNodeSize.value.bounding.width : 0;
    return sizes.value.reduce((acc, cur) => acc + cur.bounding.width, extendNodeWidth);
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

  switch (shape) {
    case "arrow": {
      const shapeSize = 5;
      return [
        `M ${x1 - shapeSize / 2} ${y1 + shapeSize}
L ${x1} ${y1}
L ${x1 + shapeSize / 2} ${y1 + shapeSize}
`,
        0,
      ];
    }
    case "circle": {
      const shapeSize = 5;
      return [
        `M ${x1} ${y1}
A ${shapeSize / 2} ${shapeSize / 2} 0.5 1 1 ${x1} ${y1 + shapeSize}
A ${shapeSize / 2} ${shapeSize / 2} 0.5 1 1 ${x1} ${y1}
`,
        shapeSize,
      ];
    }
    case "diamond": {
      const shapeSize = 8;
      return [
        `M ${x1} ${y1}
L ${x1 - shapeSize / 3} ${y1 + shapeSize / 2}
L ${x1} ${y1 + shapeSize}
L ${x1 + shapeSize / 3} ${y1 + shapeSize / 2}
Z
`,
        shapeSize,
      ];
    }
    case "triangle": {
      const shapeSize = 5;
      return [
        `M ${x1} ${y1}
L ${x1 - shapeSize / 2} ${y1 + shapeSize}
L ${x1 + shapeSize / 2} ${y1 + shapeSize}
Z
`,
        shapeSize,
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
  if (vertical.value) {
    const cur = {
      left: marginX + rectWidth.value / 2 + indentX - marginX,
      top: marginY + rectHeight.value,
    };
    function next(value: TreeNodeSize, shape?: Shape): Relative {
      const left = cur.left;
      const top = cur.top;
      const right = left + value.bounding.width;
      const bottom = top + value.bounding.height;
      // const link = `M ${marginX + rectWidth.value / 2} ${marginY + rectHeight.value}
      // L ${marginX + rectWidth.value / 2} ${top + marginY * 2}
      // s 0 ${radius} ${radius} ${radius}
      // l ${indentX - radius - marginX + value.name.x} 0`

      const x1 = marginX + rectWidth.value / 2;
      const y1 = marginY + rectHeight.value + (out.value === undefined ? 0 : out.value[1]);
      const x2 = x1;
      const y2 = top + value.name.y + value.name.height / 2;
      const dx3 = indentX - marginX + value.name.x;
      function inShapes(shape?: Shape): [string, number] | undefined {
        switch (shape) {
          case "arrow": {
            const shapeSize = 5;
            return [
              `M ${x2 + dx3 - shapeSize} ${y2 - shapeSize / 2}
l ${shapeSize} ${shapeSize / 2}
l ${-shapeSize} ${shapeSize / 2}`,
              0,
            ];
          }
          case "circle": {
            const shapeSize = 5;
            return [
              `M ${x2 + dx3 - shapeSize} ${y2}
a ${shapeSize / 2} ${shapeSize / 2} 0.5 1 1 ${shapeSize} 0
a ${shapeSize / 2} ${shapeSize / 2} 0.5 1 1 ${-shapeSize} 0
Z`,
              shapeSize,
            ];
          }
          case "diamond": {
            const shapeSize = 8;
            return [
              `M ${x2 + dx3 - shapeSize} ${y2}
l ${shapeSize / 2} ${-shapeSize / 3}
l ${shapeSize / 2} ${shapeSize / 3}
l ${-shapeSize / 2} ${shapeSize / 3}
l ${-shapeSize / 2} ${-shapeSize / 3}
Z`,
              shapeSize,
            ];
          }
          case "triangle": {
            const shapeSize = 5;
            return [
              `M ${x2 + dx3 - shapeSize} ${y2 - shapeSize / 2}
l ${shapeSize} ${shapeSize / 2}
l ${-shapeSize} ${shapeSize / 2}
l ${0} ${-shapeSize}
Z`,
              shapeSize,
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
      cur.top = bottom;
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
      const dy2 = indentY / 2 - (out.value?.[1] ?? 0);
      const x3 = cur.left + value.name.x + value.name.width / 2;
      // const dx3 = x3 - x1
      const y3 = cur.top - indentY / 2;
      const dy4 = indentY / 2 + value.name.y;
      function inShapes(shape?: Shape): [string, number] | undefined {
        switch (shape) {
          case "arrow": {
            const shapeSize = 5;
            return [
              `M ${x3 + shapeSize / 2} ${y3 + dy4 - shapeSize}
l ${-shapeSize / 2} ${shapeSize}
l ${-shapeSize / 2} ${-shapeSize}`,
              0,
            ];
          }
          case "circle": {
            const shapeSize = 5;
            return [
              `M ${x3} ${y3 + dy4 - shapeSize}
a ${shapeSize / 2} ${shapeSize / 2} 0.5 1 1 0 ${shapeSize}
a ${shapeSize / 2} ${shapeSize / 2} 0.5 1 1 0 ${-shapeSize}
Z`,
              shapeSize,
            ];
          }
          case "diamond": {
            const shapeSize = 8;
            return [
              `M ${x3} ${y3 + dy4 - shapeSize}
l ${shapeSize / 3} ${shapeSize / 2}
l ${-shapeSize / 3} ${shapeSize / 2}
l ${-shapeSize / 3} ${-shapeSize / 2}
l ${shapeSize / 3} ${-shapeSize / 2}
Z`,
              shapeSize,
            ];
          }
          case "triangle": {
            const shapeSize = 5;
            return [
              `M ${x3 + shapeSize / 2} ${y3 + dy4 - shapeSize}
l ${-shapeSize / 2} ${shapeSize}
l ${-shapeSize / 2} ${-shapeSize}
Z`,
              shapeSize,
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
      cur.left = right;
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

defineExpose({ scrollIntoView, size });

// Watch external states.
function watchActive(_active: string | number | undefined) {
  hasActive.value = _active !== undefined;
  // console.log('active', active, props.node.path)
  if ((active.value = !!_active && key.value === _active)) {
    // console.log("scroll", active, props.node.path);
    // console.log(name.value);
    scrollIntoView();
  }
}

function watchHover(_hover: string | number | undefined) {
  // console.log("hover", _hover, key.value, props.node, props.labelKey);
  hover.value = _hover !== undefined && key.value === _hover;
}

watch(props.state.active, watchActive);
watch(props.state.hover, watchHover);
</script>
