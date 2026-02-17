import { defineConfig } from "vite";
import { resolve } from "path";
import { readdirSync } from "fs";

// Get all HTML files in the current directory
const htmlFiles = readdirSync(".").filter((file) => file.endsWith(".html"));

// Create input object for all HTML files
const input = htmlFiles.reduce(
  (acc, file) => {
    const name = file.replace(".html", "");
    acc[name] = resolve(__dirname, file);
    return acc;
  },
  {} as Record<string, string>,
);

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input,
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
