<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import Tree from "./components/Tree.vue";
import { Data, Shape, TreeEvent } from "./components/types";
import "./auto.css";
import TreeV2 from "./components/TreeV2.vue";
import ForestV2 from "./components/ForestV2.vue";
import type { ComponentExposed } from "vue-component-type-helpers";
import { EventKind } from "./components/svg";
import Forest from "./components/Forest.vue";
// import ListNode from "./components/ListNode.vue";
type T = {
  name: string;
  id?: number | string;
  color?: string;
  outSelfShape?: Shape;
  outSelfFill?: string;
  outColor?: string;
  dashArray?: string | number;
  children: T[] | ((_: T) => T[]);
  inChildrenShape?: (Shape | undefined)[];
  extensible?: boolean;
};
function lazy(_: T): T[] {
  return [
    {
      name: new Date().toString(),
      outSelfShape: "diamond",
      dashArray: "4 2",
      children: lazy,
    },
    {
      name: new Date().toString(),
      outSelfShape: "circle",
      dashArray: "2 4",
      children: lazy,
    },
  ];
}
const datas: T[] = [
  {
    name: "123123123123",
    id: 123123123123,
    outSelfShape: "diamond",
    dashArray: "4 2",
    children: [
      {
        name: "445",
        id: 445,
        color: "red",
        outSelfShape: "circle",
        outSelfFill: "red",
        dashArray: 4,
        children: [
          { name: "123132", color: "cyan", children: [] },
          { name: "xdfscds", color: "cyan", children: [] },
        ],
        inChildrenShape: ["arrow", "diamond"],
      },
      {
        name: "445",
        id: "445",
        color: "green",
        outSelfShape: "triangle",
        dashArray: "2",
        children: [{ name: "9999999", color: "cyan", children: [] }],
        inChildrenShape: ["circle"],
      },
      { name: "7890", color: "red", children: [], extensible: true },
      { name: "'", color: "green", children: [], extensible: true },
      { name: "?", color: "green", children: () => [{ name: new Date().toString(), color: "blue", children: [] }], extensible: true },
      { name: "~~~~", color: "green", outSelfShape: "arrow", children: [{ name: "????", color: "blue", children: [] }], extensible: true },
      { name: "~~~~~~~~~~~~~~~~~~~~~~~~~", color: "green", children: [{ name: "????????", color: "blue", children: [] }], extensible: true },
      {
        name: "~~~~~~~~~~~~~~~~~~~~~~~~~",
        color: "green",
        children: [
          { name: "????????", color: "blue", children: [] },
          { name: "?", color: "blue", children: [] },
        ],
        extensible: false,
      },
      {
        name: "abcdefgdwewok",
        id: "kkkk",
        color: "red",
        children: [{ name: "xdncsc", color: "green", children: [] }],
        inChildrenShape: ["triangle"],
      },
      {
        name: "abcdefghijklmnopqrstuvwxyz",
        color: "red",
        extensible: true,
        children: [{ name: "abcdefghijklmnopqrstuvwxyz", color: "green", children: [] }],
      },
      {
        name: "abcdefghijklmnopqrstuvwxyz",
        color: "red",
        children: [
          { name: "a", color: "green", children: [] },
          { name: "abcdefghijklmnopqrstuvwxyz", color: "green", children: [] },
        ],
      },
      {
        name: "328948923",
        color: "red",
        extensible: true,
        children: [],
      },
      {
        name: "abcdefgdwewok",
        color: "red",
        extensible: true,
        children: [
          { name: "——", color: "green", children: [] },
          { name: "x", color: "green", children: [] },
          { name: "_", color: "green", children: [] },
          { name: "y", color: "green", children: [] },
        ],
        inChildrenShape: ["arrow", "circle", "diamond", "triangle"],
      },
      {
        name: "abcdefgdwewoknjnjonomiodjewidjwoedeowno",
        color: "red",
        extensible: true,
        children: [
          { name: "——", color: "green", children: [] },
          { name: "x", color: "green", children: [] },
          { name: "_", color: "green", children: [] },
          { name: "y", color: "green", children: [] },
        ],
      },
    ],
  },
  {
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
      },
      {
        name: "1",
        children: [
          { name: "a", extensible: true, children: [], outColor: "red", outSelfShape: "arrow", outSelfFill: "blue" },
          { name: "b", extensible: true, children: [], outColor: "green", outSelfShape: "circle", outSelfFill: "blue" },
          { name: "c", extensible: true, children: [], outColor: "cyan", outSelfShape: "diamond", outSelfFill: "blue" },
          { name: "d", extensible: true, children: [], outColor: "blue", outSelfShape: "triangle", outSelfFill: "blue" },
          { name: "e", extensible: true, children: [], outColor: undefined, outSelfShape: undefined, outSelfFill: "currentColor" },
        ],
      },
    ],
  },
  {
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
          children: lazy,
        },
      ];
    },
  },
];
// Ensure data conforms to Data interface with 'id' as key
const treeData = ref("0");
let version1 = ref(true);
let version2 = ref(true);
let tree = useTemplateRef<ComponentExposed<typeof Tree>>("_tree");
let forest = useTemplateRef<ComponentExposed<typeof Forest>>("_forest");
let tree_v2 = useTemplateRef<ComponentExposed<typeof TreeV2>>("_tree_v2");
let forest_v2 = useTemplateRef<ComponentExposed<typeof ForestV2>>("_forest_v2");
let state = {
  active: ref<string | number | undefined>(undefined),
  hover: ref<string | number | undefined>(undefined),
};

function click<T extends Data<"id">>($event: TreeEvent<T, MouseEvent>) {
  $event.event.stopPropagation();
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
  if (e.detail.originalEvent.shiftKey) {
    e.detail.node?.setVertical();
  } else {
    console.log(e.detail);
    tree_v2?.value?.setActiveKey(e.detail.node?.key);
    forest_v2?.value?.setActiveKey(e.detail.node?.key);
    // state.active.value = e.detail.node.key;
  }
}
function contextmenu2(e: CustomEvent<EventKind<"contextmenu", T, "id">>) {
  console.log("tree_v2 contextmenu", e);
  e.detail.originalEvent.preventDefault();
  e.detail.node?.setCollapsed();
}
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
      <option value="0">Arbitrary</option>
      <option value="1">Shapes</option>
      <option value="2">Lazy Evaluation</option>
      <option value="*">All</option>
    </select>
  </p>
  <p>
    <label for="active-node">Active: </label>
    <input type="text" id="active-node" title="Active Node" v-model="state.active.value" />
    &ensp;
    <label for="hover-node">Hover: </label>
    <input type="text" id="hover-node" title="Hover Node" v-model="state.hover.value" />
  </p>
  <p class="container" v-if="version1">
    <Tree
      v-if="treeData !== '*'"
      ref="_tree"
      :data="datas[Number(treeData)]"
      :label-key="'id'"
      :state="state"
      :options="undefined"
      @click="click"
      @dblclick="console.log('dblclick', $event)"
      @contextmenu="contextmenu"
    />
    <Forest v-else ref="_forest" :data="datas" :label-key="'id'" :state="state" :options="undefined" @click="click" @contextmenu="contextmenu" />
  </p>
  <p id="tree-v2" class="container" v-if="version2">
    Tree (v2)<br />
    <TreeV2 v-if="treeData !== '*'" ref="_tree_v2" :data="datas[Number(treeData)]" :label-key="'id'" :options="undefined" @click="click2" @contextmenu="contextmenu2" />
    <ForestV2 v-else ref="_forest_v2" :data="datas" :label-key="'id'" :options="undefined" @click="click2" @contextmenu="contextmenu2" />
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

svg.active > rect.node,
svg.active > .link {
  color: red !important;
  stroke: currentColor !important;
  stroke-width: 2px !important;
}

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
