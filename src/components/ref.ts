/**
 * @abstract An event target that dispatches an event when the value is set,
 * no matter whether the value is changed or not.
 */
export class SubscribedRef<T> {
  private _value: T;
  private _subscribers: Set<(payload: T) => void> = new Set();
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
