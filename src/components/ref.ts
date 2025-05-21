import { ref, Ref, watch } from "vue";

/**
 * @abstract An event target that dispatches an event when the value is set,
 * no matter whether the value is changed or not.
 * Note that this not works in `watch` and `computed`, please use `toRef` instead.
 * @template T The type of the value.
 * @example
 * const subscribedRef = new SubscribedRef(0);
 * subscribedRef.subscribe(console.log);
 * subscribedRef.value = 1; // logs 1
 * subscribedRef.value = 1; // logs 1
 * subscribedRef.value = 2; // logs 2
 * subscribedRef.unsubscribe(console.log);
 * subscribedRef.value = 3; // no logs
 * subscribedRef.value = 3; // no logs
 */
export class SubscribedRef<T> {
  private _value: T;
  private _subscribers: Set<(payload: T) => void> = new Set();
  private _ref: Ref<T> | null = null;
  constructor(value: T) {
    this._value = value;
  }
  get value() {
    return this._value;
  }
  set value(value: T) {
    this._value = value;
    this.dispatchEvent(value);
  }
  /**
   * @abstract Returns a ref that is updated when the value is set.
   * @returns The ref.
   */
  toRef(): Ref<T> {
    if (this._ref === null) {
      // SAFETY: casted from `Ref<T | undefined>` to `Ref<T>`
      // because we know that `this._ref` will be initialized later
      this._ref = ref() as Ref<T>;
      this._ref.value = this._value;
      this.subscribe((new_value) => {
        this._ref!.value = new_value;
      });
      watch(this._ref, (new_value) => {
        this.value = new_value;
      });
    }
    return this._ref;
  }
  private dispatchEvent(payload: T) {
    this._subscribers.forEach((subscriber) => subscriber(payload));
  }
  subscribe(subscriber: (payload: T) => void) {
    this._subscribers.add(subscriber);
  }
  unsubscribe(subscriber: (payload: T) => void) {
    this._subscribers.delete(subscriber);
  }
}
