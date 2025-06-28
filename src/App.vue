<script setup lang="ts">
import { ref } from "vue";
import Tree from "./components/Tree.vue";
import { Data, Shape, TreeEvent } from "./components/types";
import "./auto.css";
type T = {
  name: string;
  id?: number | string;
  color?: string;
  outSelfShape?: Shape;
  outSelfFill?: string;
  dashArray?: string | number;
  children: T[];
  inChildrenShape?: (Shape | undefined)[];
  extensible?: boolean;
};
const data: T = {
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
    { name: "~~~~", color: "green", outSelfShape: "arrow", children: [{ name: "????", color: "blue", children: [] }], extensible: true },
    { name: "~~~~~~~~~~~~~~~~~~~~~~~~~", color: "green", children: [{ name: "????????", color: "blue", children: [] }], extensible: true },
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
    {
      name: "0",
      children: [
        { name: "a", extensible: true, children: [], outSelfShape: "arrow", outSelfFill: "currentColor" },
        { name: "b", extensible: true, children: [], outSelfShape: "circle", outSelfFill: "currentColor" },
        { name: "c", extensible: true, children: [], outSelfShape: "diamond", outSelfFill: "currentColor" },
        { name: "d", extensible: true, children: [], outSelfShape: "triangle", outSelfFill: "currentColor" },
      ],
    },
    {
      name: "1",
      children: [
        { name: "a", extensible: true, children: [], outSelfShape: "arrow", outSelfFill: "blue" },
        { name: "b", extensible: true, children: [], outSelfShape: "circle", outSelfFill: "blue" },
        { name: "c", extensible: true, children: [], outSelfShape: "diamond", outSelfFill: "blue" },
        { name: "d", extensible: true, children: [], outSelfShape: "triangle", outSelfFill: "blue" },
      ],
    },
  ],
};
const _data: Data<T, "id"> = data;
let tree = ref();
let state = {
  active: ref<string | number | undefined>(undefined),
  hover: ref<string | number | undefined>(undefined),
};

function click<T extends Data<T, "id">>($event: TreeEvent<T, MouseEvent>) {
  $event.event.stopPropagation();
  if ($event.event.shiftKey) {
    console.log(($event.state.vertical.value = !$event.state.vertical.value));
  } else {
    console.log($event);
    console.log(state.active.value);
    state.active.value = $event.node.id;
  }
}

function contextmenu<T extends Data<T>>(event: TreeEvent<T, MouseEvent>) {
  event.event.preventDefault();
  event.state.collapsed.value = !event.state.collapsed.value;
}

window.addEventListener("click", () => {
  state.active.value = undefined;
});
</script>

<template>
  <p>Left Click = Set as active node</p>
  <p>Shift + Left Click = Switch direction</p>
  <p>Ctrl + Left Click = Scroll into view</p>
  <p>Right Click = Collapse or expand</p>
  <label for="active-node">Active:</label>
  <input type="text" id="active-node" title="Active Node" v-model="state.active.value" />
  <label for="hover-node">Hover:</label>
  <input type="text" id="hover-node" title="Hover Node" v-model="state.hover.value" />
  <br />
  <div class="container">
    <Tree ref="tree" :data="_data" :label-key="'id'" :state="state" :options="undefined" @click="click" @contextmenu="contextmenu" />
  </div>
  <br />
  <div class="container">
    <textarea id="tree-data" title="Tree Data">{{ JSON.stringify(data, null, 2) }}</textarea>
  </div>
</template>

<style>
.container {
  width: 99%;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
}

textarea {
  width: 98%;
  height: 20em;
}

svg.active > rect.node,
svg.active > .link {
  color: red;
  stroke: currentColor;
  stroke-width: 2px;
}
</style>
