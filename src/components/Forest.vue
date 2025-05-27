<template>
  <TreeNode
    v-for="(node, index) in data"
    :key="index"
    :node="node"
    :ctx="ctx"
    :options="options"
    :label-key="labelKey"
    :state="state"
    @click="emit('click', $event)"
    @contextmenu="emit('contextmenu', $event)"
    @mouseenter="emit('mouseenter', $event)"
    @mouseleave="emit('mouseleave', $event)"
  />
</template>

<script setup lang="ts" generic="T extends Data<T, Key>, Key extends string | number | symbol = 'path'">
import { computed } from "vue";
import TreeNode from "./TreeNode.vue";
import { createContext, Data, ExternalState, mergeOptions, Options, PartialOptions, TreeEvent } from "./types";

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

// Emits.
type Emits = {
  click: [TreeEvent<T, MouseEvent>];
  contextmenu: [TreeEvent<T, MouseEvent>];
  mouseenter: [TreeEvent<T, MouseEvent>];
  mouseleave: [TreeEvent<T, MouseEvent>];
};
const emit = defineEmits<Emits>();
</script>
