<script setup lang="ts">
import { ref } from "vue";
import Tree from "./components/Tree.vue";
import { Data, TreeEvent } from "./components/types";
type T = {
  name: string;
  color?: string;
  children: T[];
  extensible?: boolean;
};
const data: T = {
  name: "123123123123",
  children: [
    {
      name: "445",
      color: "red",
      children: [
        { name: "123132", color: "cyan", children: [] },
        { name: "xdfscds", color: "cyan", children: [] },
      ],
    },
    {
      name: "445",
      color: "green",
      children: [{ name: "9999999", color: "cyan", children: [] }],
    },
    { name: "7890", color: "red", children: [], extensible: true },
    { name: "'", color: "green", children: [], extensible: true },
    { name: "~~~~", color: "green", children: [{ name: "????", color: "blue", children: [] }], extensible: true },
    {
      name: "abcdefgdwewok",
      color: "red",
      children: [{ name: "xdncsc", color: "green", children: [] }],
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
      ]
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
      ]
    },
  ],
};
let tree = ref();
let state = {
  active: ref<string | number | undefined>(undefined),
  hover: ref<string | number | undefined>(undefined)
};

function click<T extends Data<T>>($event: TreeEvent<T, MouseEvent>) {
  if ($event.event.shiftKey) {
    console.log($event);
    console.log(state.active.value);
    state.active.value = $event.node.path;
  } else {
    console.log(($event.state.vertical.value = !$event.state.vertical.value));
  }
}

function contextmenu<T extends Data<T>>(event: TreeEvent<T, MouseEvent>) {
  event.event.preventDefault();
  event.state.collapsed.value = !event.state.collapsed.value;
}
</script>

<template>
  <Tree ref="tree" :data="data" :state="state" :options="undefined" @click="click" @contextmenu="contextmenu" />
</template>
