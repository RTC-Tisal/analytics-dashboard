// Settings for Vitest, our test runner. Run all tests with: npm test
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same shortcut as tsconfig.json: "@/lib/rates" means "src/lib/rates".
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"], // tests sit next to the code they test
    environment: "node", // plain logic for now, no browser needed
  },
});
