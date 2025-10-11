import type { Ref } from "vue";

export interface ExternalState {
  active: Ref<number | string | undefined>;
  hover: Ref<number | string | undefined>;
}

export interface State {
  active: boolean;
  hover: boolean;
}
