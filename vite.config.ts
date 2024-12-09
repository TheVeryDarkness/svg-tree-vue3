import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: true,
      tsconfigPath: "./tsconfig.app.json",
      copyDtsFiles: true,
      strictOutput: true,
    }),
  ],
  build: {
    lib: {
      entry: [
        "src/components/TreeNode.vue",
        "src/components/Tree.vue",
        "src/components/Forest.vue",
      ],
      formats: ["es", "cjs"],
    },
    sourcemap: true,
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
