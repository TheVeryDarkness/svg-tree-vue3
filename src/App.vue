<script setup lang="ts">
import { onBeforeUnmount, onMounted, Ref, ref, useTemplateRef } from "vue";
import Tree from "./components/Tree.vue";
import { Data, Shape, TreeEvent } from "tree2svg/types";
// import "./auto.css";
import TreeV2 from "./components/TreeV2.vue";
import ForestV2 from "./components/ForestV2.vue";
import type { ComponentExposed } from "vue-component-type-helpers";
import { EventKind, TreeNode } from "tree2svg/svg";
import Forest from "./components/Forest.vue";
// import ListNode from "./components/ListNode.vue";
type T = {
  name: string;
  id?: number | string;
  textColor?: string;
  borderColor?: string;
  linkColor?: string;
  outSelfShape?: Shape;
  outSelfFill?: string;
  outSelfText?: [string, string];
  outColor?: string;
  dashArray?: string | number;
  children: T[] | ((_: T) => T[]);
  inChildrenShape?: (Shape | undefined)[];
  inChildrenText?: [string | undefined, string | undefined][];
  inChildrenFill?: (string | undefined)[];
  extensible?: boolean;
};
function generateLazy(_: T): T[] {
  return [
    {
      name: new Date().toString(),
      outSelfShape: "diamond",
      dashArray: "4 2",
      children: generateLazy,
    },
    {
      name: new Date().toString(),
      outSelfShape: "circle",
      dashArray: "2 4",
      children: generateLazy,
    },
  ];
}
function generateDeep(depth: number, current: T): T {
  if (depth <= 0) {
    return current;
  }
  return generateDeep(depth - 1, {
    name: `depth-${depth}`,
    children: [current],
  });
}
const deep: T = generateDeep(40, { name: "leaf", children: [] });
function generateBinary(depth: number): T {
  if (depth <= 0) {
    return { name: `leaf`, children: [] };
  }
  return {
    name: `depth-${depth}`,
    children: [generateBinary(depth - 1), generateBinary(depth - 1)],
  };
}
const binaryTree: T = generateBinary(12);
const arbitrary: T = {
  name: "123123123123",
  id: 123123123123,
  outSelfShape: "diamond",
  dashArray: "4 2",
  children: [
    {
      name: "445",
      id: 445,
      textColor: "red",
      outSelfShape: "circle",
      outSelfFill: "red",
      outSelfText: ["A", "B"],
      dashArray: 4,
      children: [
        { name: "123132", textColor: "cyan", children: [] },
        { name: "xdfscds", textColor: "cyan", children: [] },
      ],
      inChildrenShape: ["arrow", "diamond"],
      inChildrenText: [["a", "b"]],
    },
    {
      name: "445",
      id: "445",
      textColor: "green",
      outSelfShape: "triangle",
      dashArray: "2",
      children: [{ name: "9999999", textColor: "cyan", children: [] }],
      inChildrenShape: ["circle"],
    },
    { name: "7890", textColor: "red", children: [], extensible: true },
    { name: "'", textColor: "green", children: [], extensible: true },
    { name: "?", textColor: "green", children: () => [{ name: new Date().toString(), textColor: "blue", children: [] }], extensible: true },
    { name: "~~~~", textColor: "green", outSelfShape: "arrow", children: [{ name: "????", textColor: "blue", children: [] }], extensible: true },
    { name: "~~~~~~~~~~~~~~~~~~~~~~~~~", textColor: "green", children: [{ name: "????????", textColor: "blue", children: [] }], extensible: true },
    {
      name: "~~~~~~~~~~~~~~~~~~~~~~~~~",
      textColor: "green",
      children: [
        { name: "????????", textColor: "blue", children: [] },
        { name: "?", textColor: "blue", children: [] },
      ],
      inChildrenText: [["aa", "bb"]],
      extensible: false,
    },
    {
      name: "abcdefgdwewok",
      id: "kkkk",
      textColor: "red",
      children: [{ name: "xdncsc", textColor: "green", children: [] }],
      inChildrenShape: ["triangle"],
    },
    {
      name: "abcdefghijklmnopqrstuvwxyz",
      textColor: "red",
      extensible: true,
      children: [{ name: "abcdefghijklmnopqrstuvwxyz", textColor: "green", children: [] }],
    },
    {
      name: "abcdefghijklmnopqrstuvwxyz",
      textColor: "red",
      children: [
        { name: "a", textColor: "green", children: [] },
        { name: "abcdefghijklmnopqrstuvwxyz", textColor: "green", children: [] },
      ],
      inChildrenText: [["AB", "BA"]],
    },
    {
      name: "328948923",
      textColor: "red",
      extensible: true,
      children: [],
    },
    {
      name: "abcdefgdwewok",
      textColor: "red",
      extensible: true,
      children: [
        { name: "——", textColor: "green", children: [] },
        { name: "x", textColor: "green", children: [] },
        { name: "_", textColor: "green", children: [] },
        { name: "y", textColor: "green", children: [] },
      ],
      inChildrenShape: ["arrow", "circle", "diamond", "triangle"],
      inChildrenText: [
        [":#", "#:"],
        [":#", "#:"],
        [":#", "#:"],
        [":#", "#:"],
      ],
    },
    {
      name: "abcdefgdwewoknjnjonomiodjewidjwoedeowno",
      textColor: "red",
      extensible: true,
      children: [
        { name: "——", textColor: "green", children: [] },
        { name: "x", textColor: "green", children: [] },
        { name: "_", textColor: "green", children: [] },
        { name: "y", textColor: "green", children: [] },
      ],
    },
  ],
};
const shapes: T = {
  name: "shapes",
  id: 1,
  outSelfShape: "diamond",
  dashArray: "4 2",
  children: [
    {
      name: "0",
      children: [
        { name: "a", extensible: true, children: [], outColor: "red", outSelfShape: "arrow", outSelfFill: "currentColor" },
        { name: "b", extensible: true, children: [], outColor: "green", outSelfShape: "circle", outSelfFill: "currentColor" },
        { name: "c", extensible: true, children: [], outColor: "cyan", outSelfShape: "diamond", outSelfFill: "currentColor" },
        { name: "d", extensible: true, children: [], outColor: "blue", outSelfShape: "triangle", outSelfFill: "currentColor" },
        { name: "e", extensible: true, children: [], outColor: undefined, outSelfShape: undefined, outSelfFill: "currentColor" },
      ],
      inChildrenShape: ["arrow", "circle", "diamond", "triangle", undefined],
      inChildrenFill: ["currentColor", "currentColor", "currentColor", "currentColor", "currentColor"],
    },
    {
      name: "1",
      children: [
        { name: "a", extensible: true, children: [], outColor: "red", outSelfShape: "arrow", outSelfFill: "blue" },
        { name: "b", extensible: true, children: [], outColor: "green", outSelfShape: "circle", outSelfFill: "blue" },
        { name: "c", extensible: true, children: [], outColor: "cyan", outSelfShape: "diamond", outSelfFill: "blue" },
        { name: "d", extensible: true, children: [], outColor: "blue", outSelfShape: "triangle", outSelfFill: "blue" },
        { name: "e", extensible: true, children: [], outColor: undefined, outSelfShape: undefined, outSelfFill: "blue" },
      ],
      inChildrenShape: ["arrow", "circle", "diamond", "triangle", undefined],
      inChildrenFill: ["blue", "blue", "blue", "blue", "blue"],
    },
  ],
};
const lazy: T = {
  name: "lazy",
  id: 1,
  outSelfShape: "diamond",
  dashArray: "4 2",
  children() {
    return [
      {
        name: new Date().toString(),
        id: 1,
        outSelfShape: "diamond",
        dashArray: "4 2",
        children: generateLazy,
      },
    ];
  },
};
const uml: T = {
  name: "UML Class Diagram",
  children: [
    {
      name: "AggregatedClass",
      id: "A",
      outSelfShape: "diamond",
      children: [
        {
          name: "ComponentClass 1",
          id: "B1",
          children: [],
        },
        {
          name: "ComponentClass 2",
          id: "B2",
          children: [],
        },
      ],
    },
    {
      name: "InheritedClass",
      id: "A",
      outSelfShape: "triangle",
      children: [
        {
          name: "DerivedClass 1",
          id: "B1",
          children: [],
        },
        {
          name: "DerivedClass 2",
          id: "B2",
          children: [],
        },
      ],
    },
    {
      name: "DependentClass",
      id: "A",
      children: [
        {
          name: "DependenciesClass 1",
          id: "B1",
          children: [],
        },
        {
          name: "DependenciesClass 2",
          id: "B2",
          children: [],
        },
      ],
      inChildrenShape: ["arrow"],
      dashArray: "4 2",
    },
    {
      name: "CompositeClass",
      id: "A",
      outSelfShape: "diamond",
      outSelfFill: "currentColor",
      children: [
        {
          name: "ComponentClass 1",
          id: "B1",
          children: [],
        },
        {
          name: "ComponentClass 2",
          id: "B2",
          children: [],
        },
      ],
    },
    {
      name: "LinkedClass",
      id: "A",
      children: [
        {
          name: "LinkedClass 1",
          id: "B1",
          children: [],
        },
        {
          name: "LinkedClass 2",
          id: "B2",
          children: [],
        },
      ],
    },
  ],
};
type DataMapKey = "arbitrary" | "shapes" | "lazy" | "deep" | "binaryTree" | "uml";
const dataMap: Record<DataMapKey, T> = {
  arbitrary,
  shapes,
  lazy,
  deep,
  binaryTree,
  uml,
} as const;
const datas: T[] = Object.values(dataMap);
// Ensure data conforms to Data interface with 'id' as key
const treeData: Ref<"*" | keyof typeof dataMap> = ref("uml");
let version1 = ref(true);
let version2 = ref(true);
let tree = useTemplateRef<ComponentExposed<typeof Tree>>("_tree");
let forest = useTemplateRef<ComponentExposed<typeof Forest>>("_forest");
let tree_v2 = useTemplateRef<ComponentExposed<typeof TreeV2<T, "id">>>("_tree_v2");
let forest_v2 = useTemplateRef<ComponentExposed<typeof ForestV2<T, "id">>>("_forest_v2");
const state = {
  active: ref<string | number | undefined>(undefined),
  hover: ref<string | number | undefined>(undefined),
};
const state2 = {
  active: ref<string | number | undefined>(undefined),
  hover: ref<string | number | undefined>(undefined),
};

function click<T extends Data<"id">>($event: TreeEvent<T, MouseEvent>) {
  $event.event.stopPropagation();
  $event.event.preventDefault();
  if ($event.event.shiftKey) {
    $event.setVertical();
  } else {
    console.log($event);
    console.log(state.active.value);
    state.active.value = $event.node.id;
  }
}

function contextmenu<T extends Data<"id">>(event: TreeEvent<T, MouseEvent>) {
  event.event.preventDefault();
  event.setCollapsed();
}

window.addEventListener("click", () => {
  state.active.value = undefined;
});

function saveSvg() {
  console.log(tree.value?.svg, forest.value?.svg, tree_v2.value?.svg, forest_v2.value?.svg);
}

function click2(e: CustomEvent<EventKind<"click", T, "id">>) {
  console.log("tree_v2 click", e);
  e.detail.originalEvent.stopPropagation();
  e.detail.originalEvent.preventDefault();
  if (e.detail.originalEvent.shiftKey) {
    e.detail.node?.setVertical();
  } else {
    console.log(e.detail);
    if (e.detail.node) {
      tree_v2?.value?.setActiveNode(e.detail.node);
      forest_v2?.value?.setActiveNode(e.detail.node);
      // state.active.value = e.detail.node.key;
    } else {
      tree_v2?.value?.setActiveNode(undefined);
      forest_v2?.value?.setActiveNode(undefined);
    }
  }
}
function contextmenu2(e: CustomEvent<EventKind<"contextmenu", T, "id">>) {
  console.log("tree_v2 contextmenu", e);
  e.detail.originalEvent.preventDefault();
  e.detail.node?.setCollapsed();
}
function mouseenter2(e: CustomEvent<EventKind<"mouseenter", T, "id">>) {
  // console.log("tree_v2 mouseenter", e);
  state2.hover.value = e.detail.node.key;
}
function mouseleave2(_: CustomEvent<EventKind<"mouseleave", T, "id">>) {
  // console.log("tree_v2 mouseleave", e);
  state2.hover.value = undefined;
}
function active2(e: CustomEvent<EventKind<"active", T, "id">>) {
  console.log("tree_v2 active", e);
  state2.active.value = e.detail.key;
  e.detail.node[0]?.scrollIntoView();
  e.detail.node[0]?.ref.focus();
}

function keydown(e: KeyboardEvent) {
  console.log("global keydown", e);
  console.log(tree_v2.value?.root()?.activeNodes, forest_v2.value?.root()?.activeNodes);
  function updateTreeActive(
    current: TreeNode<T, "id"> | undefined,
    f: (_: TreeNode<T, "id"> | undefined) => TreeNode<T, "id"> | undefined,
    setter: (n: TreeNode<T, "id">) => void,
  ) {
    const node = f(current);
    if (node) setter(node);
  }
  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      updateTreeActive(
        tree_v2.value?.root()?.activeNode,
        (n) => n?.parent,
        (n) => tree_v2.value?.root()?.setActiveNode(n),
      );
      updateTreeActive(
        forest_v2.value?.root()?.activeNode,
        (n) => n?.parent,
        (n) => forest_v2.value?.root()?.setActiveNode(n),
      );
      break;
    case "ArrowDown":
      e.preventDefault();
      updateTreeActive(
        tree_v2.value?.root()?.activeNode,
        (n) => n?.children[0],
        (n) => tree_v2.value?.root()?.setActiveNode(n),
      );
      updateTreeActive(
        forest_v2.value?.root()?.activeNode,
        (n) => n?.children[0],
        (n) => forest_v2.value?.root()?.setActiveNode(n),
      );
      break;
    case "ArrowLeft":
      e.preventDefault();
      updateTreeActive(
        tree_v2.value?.root()?.activeNode,
        (n) => n?.prevSibling,
        (n) => tree_v2.value?.root()?.setActiveNode(n),
      );
      updateTreeActive(
        forest_v2.value?.root()?.activeNode,
        (n) => n?.prevSibling,
        (n) => forest_v2.value?.root()?.setActiveNode(n),
      );
      break;
    case "ArrowRight":
      e.preventDefault();
      updateTreeActive(
        tree_v2.value?.root()?.activeNode,
        (n) => n?.nextSibling,
        (n) => tree_v2.value?.root()?.setActiveNode(n),
      );
      updateTreeActive(
        forest_v2.value?.root()?.activeNode,
        (n) => n?.nextSibling,
        (n) => forest_v2.value?.root()?.setActiveNode(n),
      );
      break;
    case "Enter":
      e.preventDefault();
      tree_v2.value?.root()?.activeNode?.setCollapsed();
      forest_v2.value?.root()?.activeNode?.setCollapsed();
      break;
    case " ":
      e.preventDefault();
      tree_v2.value?.root()?.activeNode?.setVertical();
      forest_v2.value?.root()?.activeNode?.setVertical();
      break;
    default:
      break;
  }
}

onMounted(() => {
  window.addEventListener("keydown", keydown);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", keydown);
});
</script>

<template>
  <p>Left Click = Set as active node</p>
  <p>Shift + Left Click = Switch direction</p>
  <p>Ctrl + Left Click = Scroll into view</p>
  <p>Right Click = Collapse or expand</p>
  <p>
    <label for="v1">Version 1: </label>
    <input id="v1" type="checkbox" v-model="version1" />
    &ensp;
    <label for="v2">Version 2: </label>
    <input id="v2" type="checkbox" v-model="version2" />
  </p>
  <p>
    <label for="save-svg">Save SVG: </label>
    <button id="save-svg" @click="saveSvg">Save</button>
  </p>
  <p>
    <label for="tree-data">Tree Data: </label>
    <select id="tree-data" title="Tree Data" v-model="treeData">
      <option v-for="(name, idx) in Object.keys(dataMap)" :key="idx" :value="name">{{ name }}</option>
      <option value="*">All</option>
    </select>
  </p>
  <p>
    <label for="active-node">Active (Version 1): </label>
    <input type="text" id="active-node" title="Active Node" v-model="state.active.value" />
    &ensp;
    <label for="hover-node">Hover (Version 1): </label>
    <input type="text" id="hover-node" title="Hover Node" v-model="state.hover.value" />
  </p>
  <p>
    <label for="active-node">Active (Version 2): </label>
    <input type="text" id="active-node" title="Active Node" v-model="state2.active.value" />
    &ensp;
    <label for="hover-node">Hover (Version 2): </label>
    <input type="text" id="hover-node" title="Hover Node" v-model="state2.hover.value" />
  </p>
  <p class="container" v-if="version1">
    <Tree v-if="treeData !== '*'" ref="_tree" :data="dataMap[treeData]" :label-key="'id'" :state="state" :options="undefined" @click="click" @contextmenu="contextmenu" />
    <Forest v-else ref="_forest" :data="datas" :label-key="'id'" :state="state" :options="undefined" @click="click" @contextmenu="contextmenu" />
  </p>
  <p id="tree-v2" class="container" v-if="version2">
    Tree (v2)<br />
    <TreeV2
      v-if="treeData !== '*'"
      ref="_tree_v2"
      :data="dataMap[treeData]"
      :label-key="'id'"
      :options="undefined"
      @click="click2"
      @contextmenu="contextmenu2"
      @mouseenter="mouseenter2"
      @mouseleave="mouseleave2"
      @active="active2"
    />
    <ForestV2
      v-else
      ref="_forest_v2"
      :data="datas"
      :label-key="'id'"
      :options="undefined"
      @click="click2"
      @contextmenu="contextmenu2"
      @mouseenter="mouseenter2"
      @mouseleave="mouseleave2"
      @active="active2"
    />
  </p>
  <p class="container">
    <textarea v-if="treeData !== '*'" id="tree-data" title="Tree Data">{{ JSON.stringify(datas[Number(treeData)], null, 2) }}</textarea>
    <!-- <ListNode :node="datas[treeData]" :label-key="'id'" /> -->
  </p>
</template>

<style>
/* .container {
  width: 99%;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
} */

textarea {
  width: 98%;
  height: 20em;
}

/* svg.active > rect.node,
svg.active > .link {
  color: red !important;
  stroke: currentColor !important;
  stroke-width: 2px !important;
} */

@media (prefers-color-scheme: light) {
  html {
    background-color: white;
    color: black;
  }
}

@media (prefers-color-scheme: dark) {
  html {
    background-color: black;
    color: white;
  }
}
</style>
