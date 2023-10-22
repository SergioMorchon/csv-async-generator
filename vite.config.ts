import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [dts()],
	build: {
		lib: {
			entry: "src/index.ts",
			formats: ["es"],
			fileName: "index",
		},
		outDir: "dist",
		sourcemap: true,
		emptyOutDir: true,
	},
});
