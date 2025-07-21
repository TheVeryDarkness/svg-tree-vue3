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
      entry: ["src/components/TreeNode.vue", "src/components/Tree.vue", "src/components/Forest.vue", "src/components/types.ts", "src/auto.css", "src/dark.css", "src/light.css"],
      formats: ["es", "cjs"],
    },
    cssCodeSplit: true,
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
