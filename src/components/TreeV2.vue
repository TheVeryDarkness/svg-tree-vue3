<template>
  <span ref="_root" />
</template>

<script setup lang="ts" generic="T extends Data<Key> & Children<T>, Key extends string | number | symbol = 'path'">
import { computed, onMounted, onUnmounted, onUpdated, useTemplateRef, watch } from "vue";
import { EventKind, Tree, TreeNode } from "tree2svg/svg";
import { Children, createContext, Data, mergeOptions, Options, PartialOptions } from "tree2svg/types";

onMounted(() => {
  // console.log("TreeV2 mounted");
});

// Props.
const props = defineProps<{
  data: T;
  options: PartialOptions;
  labelKey: Key;
}>();

const options = computed<Options>(() => mergeOptions(props.options));
const canvas = new OffscreenCanvas(0, 0);
const ctx = createContext(canvas);

let tree: Tree<T, Key> | null = null;

// Expose
const root = useTemplateRef("_root");
defineExpose({
  root() {
    return tree;
  },
  svg: computed(() => tree?.svg ?? null),
  setActiveKey(key: string | number | undefined) {
    tree?.setActiveKey(key);
  },
  setActiveNode(node: TreeNode<T, Key> | undefined) {
    tree?.setActiveNode(node);
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
  tree = new Tree(props.data, props.labelKey, options.value, ctx);
  if (root.value) {
    tree.mountTo(root.value);
    tree.addEventListener("click", (e) => emit("click", e));
    tree.addEventListener("active", (e) => emit("active", e));
    tree.addEventListener("contextmenu", (e) => emit("contextmenu", e));
    tree.addEventListener("mouseenter", (e) => emit("mouseenter", e));
    tree.addEventListener("mouseleave", (e) => emit("mouseleave", e));
  }
});
onUnmounted(() => {
  if (root.value) tree?.unmountFrom(root.value);
  tree = null;
});
onUpdated(() => {
  if (tree) {
    tree.update();
  }
});

watch(
  () => props.data,
  (newData) => {
    if (tree) {
      tree.update(newData);
    }
  },
);
watch(
  () => props.options,
  (newData) => {
    if (tree) {
      tree.update(undefined, undefined, newData);
    }
  },
  { deep: true },
);
</script>
