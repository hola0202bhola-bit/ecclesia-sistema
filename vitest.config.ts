import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/composition/server.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
    },
  },
});
