<template>
  <span ref="_root" />
</template>

<script setup lang="ts" generic="T extends Data<Key> & Children<T>, Key extends string | number | symbol = 'path'">
import { computed, onBeforeUnmount, onMounted, onUpdated, useTemplateRef, watch } from "vue";
import { EventKind, Forest, TreeNode } from "tree2svg/svg";
import { Children, createContext, Data, mergeOptions, Options, PartialOptions } from "tree2svg/types";

onMounted(() => {
  // console.log("TreeV2 mounted");
});

// Props.
const props = defineProps<{
  data: T[];
  options: PartialOptions;
  labelKey: Key;
}>();

const options = computed<Options>(() => mergeOptions(props.options));
const canvas = new OffscreenCanvas(0, 0);
const ctx = createContext(canvas);

let forest: Forest<T, Key> | null = null;

const root = useTemplateRef("_root");

// Expose
defineExpose({
  root() {
    return forest;
  },
  svg: computed(() => forest?.svg ?? null),
  setActiveKey(key: string | number | undefined) {
    forest?.setActiveKey(key);
  },
  setActiveNode(node: TreeNode<T, Key> | undefined) {
    forest?.setActiveNode(node);
  },
});

// Emits.
type Emits = {
  click: [CustomEvent<EventKind<"click", T, Key>>];
  active: [CustomEvent<EventKind<"active", T, Key>>];
  contextmenu: [CustomEvent<EventKind<"contextmenu", T, Key>>];
  mouseenter: [CustomEvent<EventKind<"mouseenter", T, Key>>];
  mouseleave: [CustomEvent<EventKind<"mouseleave", T, Key>>];
};
const emit = defineEmits<Emits>();

onMounted(() => {
  forest = new Forest(props.data, props.labelKey, options.value, ctx);
  if (root.value) {
    forest.mountTo(root.value);
    forest.addEventListener("click", (e) => emit("click", e));
    forest.addEventListener("active", (e) => emit("active", e));
    forest.addEventListener("contextmenu", (e) => emit("contextmenu", e));
    forest.addEventListener("mouseenter", (e) => emit("mouseenter", e));
    forest.addEventListener("mouseleave", (e) => emit("mouseleave", e));
  }
});
onBeforeUnmount(() => {
  if (root.value) forest?.unmountFrom(root.value);
  forest = null;
});
onUpdated(() => {
  if (forest) {
    forest.update();
  }
});

watch(
  () => [props.data, props.options] as const,
  ([newData, newOptions]) => {
    // console.log("Data or options changed", newData);
    if (forest) {
      forest.update(newData, undefined, newOptions);
    }
  },
);
</script>
