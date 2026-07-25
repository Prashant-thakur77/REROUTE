import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "node",
    // Only run the maintained unit suite under tests/ — the ad-hoc scripts in
    // __tests__/ are manual integration scripts, not vitest tests.
    include: ["tests/**/*.test.ts"],
  },
})
