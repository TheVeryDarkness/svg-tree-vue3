<script setup lang="ts">
import { ref } from 'vue';
import TreeNode from './components/TreeNode.vue';
const canvas = new OffscreenCanvas(100, 100);
const ctx = canvas.getContext('2d')!;
ctx.font = '14px Jetbrains Mono';
ctx.textAlign = 'center'
ctx.textRendering = 'optimizeLegibility'

const data = { name: "123123123123", color: 'green', children: [{ name: "445", color: 'red', children: [{ 'name': '123132', color: 'cyan', children: [] }, { 'name': 'xdfscds', color: 'cyan', children: [] }] }, { name: "445", color: 'red', children: [{ 'name': '9999999', color: 'cyan', children: [] }] }, { name: "7890", color: 'red', children: [] }, { name: "abcdefgdwewok", color: 'red', children: [{ name: 'xdncsc', color: 'green', children: [] }] }, { name: "abcdefgdwewok", color: 'red', children: [{ name: '——', color: 'green', children: [] }, { name: 'x', color: 'green', children: [] }, { name: '_', color: 'green', children: [] }, { name: 'y', color: 'green', children: [] }] }] }
let tree = ref();
</script>

<template>
  <TreeNode :node="data" :ctx="ctx" ref="tree"
    @click="console.log($event.state.vertical.value = !$event.state.vertical.value)" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
