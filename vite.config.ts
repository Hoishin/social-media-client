import { defineConfig } from "vite";
import * as remix from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths(), remix.vitePlugin()],
	build: {
		target: ["chrome120", "node20"],
	},
	clearScreen: false,
});
