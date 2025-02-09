# SVG Tree Vue3

This is some simple SVG tree components for Vue3.

The [demo page](https://theverydarkness.github.io/svg-tree-vue3/), which is also used for testing, is available.

## Usage

[Here](./src/App.vue) is an example of how to use the component.

### Noted

Currently, some parts of the prop `options`, such as `options.font.fontFamily`, are not reactive (they could be, but I'm worrying the overhead, and I haven't tested which parts are not reactive), so you may need to use `key` to force the component to re-render if you need to change them.

Pleaas open an issue if you *actually* need this feature.
