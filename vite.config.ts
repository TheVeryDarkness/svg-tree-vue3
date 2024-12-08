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
      entry: "src/components/TreeNode.vue",
      formats: ["es", "cjs"],
      fileName: "TreeNode",
    },
    minify: "esbuild",
    sourcemap: true,
    cssCodeSplit: false,
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
