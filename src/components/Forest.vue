<template>
  <TreeNode
    v-for="(node, index) in data"
    ref="_roots"
    :key="index"
    :node="node"
    :ctx="ctx"
    :options="options"
    :label-key="labelKey"
    :state="state"
    @click="emit('click', $event)"
    @dblclick="emit('dblclick', $event)"
    @active="emit('active', $event)"
    @contextmenu="emit('contextmenu', $event)"
    @mouseenter="emit('mouseenter', $event)"
    @mouseleave="emit('mouseleave', $event)"
  />
</template>

<script setup lang="ts" generic="T extends Data<T, Key>, Key extends string | number | symbol = 'path'">
import { computed, useTemplateRef } from "vue";
import TreeNode from "./TreeNode.vue";
import { createContext, Data, mergeOptions, Options, PartialOptions, TreeEvent } from "./types";
import { ExternalState } from "./state";
import { ComponentExposed } from "vue-component-type-helpers";

// Props.
const props = defineProps<{
  data: T[];
  options: PartialOptions;
  state: ExternalState;
  labelKey: Key;
}>();

const options = computed<Options>(() => mergeOptions(props.options));
const canvas = new OffscreenCanvas(100, 100);
const ctx = createContext(canvas);

const roots = useTemplateRef<ComponentExposed<typeof TreeNode>[]>("_roots");

// Expose
defineExpose({ roots, svg: computed(() => roots.value?.map((root) => root.svg) ?? []) });

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
</script>
