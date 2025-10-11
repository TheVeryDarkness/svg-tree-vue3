<template>
  <TreeNode
    ref="_root"
    :node="data"
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

<script setup lang="ts" generic="T extends Data<Key> & Children<T>, Key extends string | number | symbol = 'path'">
import { computed, useTemplateRef } from "vue";
import TreeNode from "./TreeNode.vue";
import { Children, createContext, Data, mergeOptions, Options, PartialOptions, TreeEvent } from "./types";
import type { ComponentExposed } from "vue-component-type-helpers";
import type { ExternalState } from "./state";

// Props.
const props = defineProps<{
  data: T;
  options: PartialOptions;
  state: ExternalState;
  labelKey: Key;
}>();

const options = computed<Options>(() => mergeOptions(props.options));
const canvas = new OffscreenCanvas(100, 100);
const ctx = createContext(canvas);

const root = useTemplateRef<ComponentExposed<typeof TreeNode>>("_root");

// Expose
defineExpose({ root, svg: computed(() => root.value?.svg ?? null) });

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
