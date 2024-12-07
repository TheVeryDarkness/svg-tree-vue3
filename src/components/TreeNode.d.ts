import type { Ref } from "vue";

export interface Data<Child extends Data> {
  name: string;
  color?: string;
  backgroundColor?: string;
  children: Child[];
}
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface TreeNodeSize {
  bounding: { width: number; height: number };
  name: Rectangle;
}
export interface State {
  vertical: Ref<boolean>;
  collapsed: Ref<boolean>;
}
export interface TreeEvent<Child, E extends Event> {
  node: Data<Child>;
  state: State;
  event: E;
}
