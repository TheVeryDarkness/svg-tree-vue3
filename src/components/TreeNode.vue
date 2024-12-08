<template>
    <svg ref="svg" :view-box="viewBox" :width="width" :height="height" enable-background="true" fill="none"
        xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <rect class="shadow" :x="rect.x + 4" :y="rect.y + 4" :rx="radius" :width="rect.width" :height="rect.height"
            :style="{ fill: shadowColor }" v-if="collapsed" />
        <rect :x="rect.x" :y="rect.y" :rx="radius" :width="rect.width" :height="rect.height"
            :style="{ fill: node.backgroundColor ?? backgroundColor }" />
        <!-- <rect :width="width" :height="height" stroke="red" fill="none" /> -->
        <!-- <line :x1="sizes[0]?.name?.x ?? 0 + (sizes[0]?.name?.width ?? 0) / 2" :y1="paddingY"
            :x2="sizes.reduce((acc, cur) => acc + (cur?.bounding?.width ?? 0), 0) - (sizes[sizes.length - 1]?.bounding?.width ?? 0) + (sizes[sizes.length - 1]?.name?.x ?? 0) + (sizes[sizes.length - 1]?.name?.width ?? 0) / 2"
            :y2="paddingY" stroke="green" /> -->
        <text ref="name" :x="text.x" :y="text.y" font-family="Jetbrains Mono" font-size="14px"
            :style="{ fill: node.color ?? textColor }" @click="emit('click', event($event))"
            @contextmenu="emit('contextmenu', event($event))" cursor="pointer">{{
                node.name
            }}</text>
        <!-- :x="rectWidth / 2 + indentX" :y="(1 + index) * (fontSize.height + paddingY * 2 + gapY * 2)" -->
        <tree-node v-for="(value, index) of node.children" v-if="!collapsed" :node="value" :key="index" :ctx="ctx"
            :options="options" v-bind:active="active" :x="relative[index]?.left" :y="relative[index]?.top"
            :class="{ collapsed }" @update:size="updateSize(index, $event)" @click="emit('click', $event)"
            @contextmenu="emit('contextmenu', $event)"></tree-node>
        <path v-for="(_, index) of node.children" v-if="!collapsed" :key="index" fill="none" :stroke="borderColor"
            :d="relative[index]?.link" />
    </svg>
</template>
<script setup lang="ts" generic="T extends Data<T>">
import { computed, onMounted, reactive, Ref, ref, watch } from 'vue';
import { type Data, type Options, type Rectangle, type TreeEvent, type TreeNodeSize } from './types';

const props = defineProps<{ node: T, ctx: OffscreenCanvasRenderingContext2D, options: Options, active: { string: Ref<string | number | undefined> } }>();

const {
    indentX,
    indentY,
    marginY,
    marginX,
    paddingY,
    paddingX,
    radius,
} = props.options.layout;

const {
    borderColor,
    backgroundColor,
    shadowColor,
    textColor,
    textWeight,
    textHoverColor,
    textHoverWeight,
} = props.options.color;

const svg = ref<SVGElement>();
const name = ref<SVGTextElement>();
const vertical = ref<boolean>(true);
const collapsed = ref<boolean>(false);

// Track the size of each node.

type Emits = { 'update:size': [TreeNodeSize], 'click': [TreeEvent<T, MouseEvent>], 'contextmenu': [TreeEvent<T, MouseEvent>] }
const emit = defineEmits<Emits>()

function event<E extends MouseEvent>(event: E) {
    return { event, node: props.node, state: { vertical, collapsed } }
}

const sizes = reactive<TreeNodeSize[]>([])

function updateSize(index: number, size: TreeNodeSize) {
    sizes[index] = size;
}

// Some constants or variables for size calculation.

const fontSize = computed(function () {
    const metrics = props.ctx.measureText(props.node.name);
    const width = metrics.width;
    // const height = metrics.emHeightAscent + metrics.emHeightDescent;
    // const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    const baselineOffsetY = metrics.fontBoundingBoxAscent;
    return { width, height, baselineOffsetY };
})

const rectWidth = computed(() => fontSize.value.width + paddingX * 2);
const rectHeight = computed(() => fontSize.value.height + paddingY * 2);

const width = computed(function () {
    if (sizes.length === 0 || collapsed.value) {
        return rectWidth.value + marginX * 2;
    }
    else if (vertical.value) {
        return sizes.reduce((acc, cur) => Math.max(acc, cur.bounding.width + rectWidth.value / 2 + indentX), rectWidth.value + marginX * 2);
    } else {
        return Math.max(sizes.reduce((acc, cur) => acc + cur.bounding.width, 0), rectWidth.value + marginX * 2);
    }
})

const height = computed(function () {
    if (sizes.length === 0 || collapsed.value) {
        return rectHeight.value + marginY * 2;
    } else if (vertical.value) {
        return sizes.reduce((acc, cur) => acc + cur.bounding.height, rectHeight.value + marginY);
    } else {
        return rectHeight.value + marginY + indentY + sizes.reduce((acc, cur) => Math.max(acc, cur.bounding.height), 0);
    }
})

const childrenWidth = computed(function () {
    if (sizes.length > 0 && !vertical.value) {
        return sizes.reduce((acc, cur) => acc + cur.bounding.width, 0)
    } else {
        return 0
    }
})

const middle = computed(function () {
    const first = sizes[0]
    const last = sizes[sizes.length - 1]
    const leftFirst = Math.max(0, width.value - childrenWidth.value) / 2
    const firstMiddleX = first.name.x + first.name.width / 2
    const lastMiddleX = childrenWidth.value - last.bounding.width + last.name.x + last.name.width / 2
    return leftFirst + (lastMiddleX + firstMiddleX) / 2
})

const relative = computed(function (): { left: number, top: number, right: number, bottom: number, link: string }[] {
    if (vertical.value) {
        const cur = { left: marginX + rectWidth.value / 2 + indentX - marginX, top: marginY + rectHeight.value }
        const results = sizes.map((value) => {
            const left = cur.left;
            const top = cur.top;
            const right = left + value.bounding.width;
            const bottom = top + value.bounding.height;
            // const link = `M ${marginX + rectWidth.value / 2} ${marginY + rectHeight.value}
            // L ${marginX + rectWidth.value / 2} ${top + marginY * 2}
            // s 0 ${radius} ${radius} ${radius}
            // l ${indentX - radius - marginX + value.name.x} 0`
            const link = `M ${marginX + rectWidth.value / 2} ${marginY + rectHeight.value}
            L ${marginX + rectWidth.value / 2} ${top + value.name.y + value.name.height / 2 - radius}
            s 0 ${radius} ${radius} ${radius}
            l ${indentX - radius - marginX + value.name.x} 0`
            cur.top = bottom;
            return { left, top, right, bottom, link }
        })
        return results
    } else {
        const cur = { left: Math.max(0, width.value - childrenWidth.value) / 2, top: marginY + rectHeight.value + indentY }
        const results = sizes.map((value) => {
            const left = cur.left;
            const top = cur.top;
            const right = left + value.bounding.width;
            const bottom = top + value.bounding.height;
            const link = `M ${middle.value} ${marginY + rectHeight.value}
            l 0 ${indentY / 2}
            L ${cur.left + value.name.x + value.name.width / 2} ${cur.top - indentY / 2}
            l 0 ${indentY / 2 + value.name.y}`
            cur.left = right;
            return { left, top, right, bottom, link }
        })
        return results
    }
})

const viewBox = computed(() => `0 0 ${width.value} ${height.value}`)

const rect = computed(function () {
    if (sizes.length === 0 || collapsed.value) {
        return {
            x: marginX,
            y: marginY,
            width: rectWidth.value,
            height: rectHeight.value
        }
    } else if (vertical.value) {
        return {
            x: marginX,
            y: marginY,
            width: rectWidth.value,
            height: rectHeight.value
        }
    } else {
        return {
            x: middle.value - rectWidth.value / 2,
            y: marginY,
            width: rectWidth.value,
            height: rectHeight.value
        }
    }
})

const text = computed(function () {
    if (vertical.value)
        return {
            x: marginX + paddingX,
            y: marginY + fontSize.value.baselineOffsetY + paddingY
        }
    else return {
        x: rect.value.x + paddingX,
        y: marginY + fontSize.value.baselineOffsetY + paddingY
    }
})

const size = computed(function (): TreeNodeSize {
    const name: Rectangle = rect.value
    return { bounding: { width: width.value, height: height.value }, name }
})

watch(size, (size) => {
    emit('update:size', size)
})

onMounted(() => {
    emit('update:size', size.value)
})

// Expose a method to export the SVG content.
function exportSVG(): string | undefined {
    return svg.value?.innerHTML
}

defineExpose({ exportSVG });

//
watch(props.active.string, (active) => {
    // console.log('active', active, props.node.path)
    if (active && props.node.path === active) {
        console.log('scroll', active, props.node.path)
        console.log(name.value)
        name.value?.scrollIntoView({ 'behavior': 'smooth', 'block': 'center', 'inline': 'center' })
    }
})

</script>

<style scoped>
svg>text {
    font-weight: 400;
    user-select: none;
}

svg>text:hover {
    font-weight: 700;
}

svg>* {
    color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {

    svg>rect,
    svg>path {
        stroke: lightgray;
    }

    svg>rect {
        fill: darkgray;
    }

    svg>rect.shadow {
        fill: black;
    }

    svg>text {
        fill: white;
    }

    svg>text:hover {
        fill: cyan;
    }
}


svg>rect,
svg>path {
    stroke: gray;
}

svg>rect {
    fill: white;
}

svg>rect.shadow {
    fill: darkgray;
}

svg>text {
    fill: black;
}

svg>text:hover {
    fill: darkcyan;
}
</style>
