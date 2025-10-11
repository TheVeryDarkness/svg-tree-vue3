# SVG Tree Vue3

This is some simple SVG tree components for Vue3.

The [demo page](https://theverydarkness.github.io/svg-tree-vue3/), which is also used for testing, is available.

## Usage

[Here](./src/App.vue) is an example of how to use the component.

### CSS Classes

- `node`: The node element. Including the box and inner text.
- `link`: The link element. The line from the parent node to the child node.
- `shadow`: The shadow element. The shadow of the node.
- `extend`: The extend element. The line from the node to the extend node and the extend node itself.

#### `options`

You can use both the `options` prop and CSS classes to customize the appearance of the tree.

```ts
// Default options in light mode
export const defaultLightColorOptions: ColorOptions = {
  // Stroke color of node borders and links.
  //
  // Could also be defined as:
  //
  // svg>rect, svg>path {
  //   stroke: gray;
  // }
  borderColor: "gray",
  // Fill color of nodes.
  //
  // Could also be defined as:
  //
  // svg>rect.node {
  //   fill: white;
  // }
  backgroundColor: "white",
  // Fill color of node shadows.
  //
  // Could also be defined as:
  //
  // svg>rect.shadow {
  //   fill: darkgray;
  // }
  shadowColor: "darkgray",
  // Fill color of texts.
  //
  // Could also be defined as:
  //
  // svg>text {
  //   fill: black;
  // }
  textColor: "black",
  textWeight: 400,
  // Fill color of texts when hovering.
  //
  // Could also be defined as:
  //
  // svg.hover>text {
  //   fill: black;
  // }
  textHoverColor: "darkcyan",
  textHoverWeight: 700,
  // Fill color of texts when active.
  //
  // Could also be defined as:
  //
  // svg.active>text {
  //   fill: black;
  // }
  textActiveColor: "darkcyan",
  textActiveWeight: 1000,
};
```
