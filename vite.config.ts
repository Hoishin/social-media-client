import { defineConfig } from "vite";
import * as remix from "@remix-run/dev";

export default defineConfig({
	plugins: [remix.vitePlugin()],
	build: {
		target: ["chrome120", "node20"],
	},
	clearScreen: false,
});
