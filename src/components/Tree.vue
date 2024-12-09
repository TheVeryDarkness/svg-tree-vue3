<template>
    <TreeNode :node="data" :ctx="ctx" :options="options" :state="state" @click="emit('click', $event)"
        @contextmenu="emit('contextmenu', $event)" @mouseenter="emit('mouseenter', $event)"
        @mouseleave="emit('mouseleave', $event)" />
</template>

<script setup lang="ts" generic="T extends Data<T>">
import TreeNode from './TreeNode.vue';
import { createContext, Data, ExternalState, mergeOptions, Options, TreeEvent } from './types';

// Props.
const props = defineProps<{
    data: T;
    options: Partial<Options> | undefined;
    state: ExternalState;
}>();

const options: Options = mergeOptions(props.options);
const ctx = createContext(options.font);

// Emits.
type Emits = {
    click: [TreeEvent<T, MouseEvent>];
    contextmenu: [TreeEvent<T, MouseEvent>];
    mouseenter: [TreeEvent<T, MouseEvent>];
    mouseleave: [TreeEvent<T, MouseEvent>];
};
const emit = defineEmits<Emits>();

</script>
