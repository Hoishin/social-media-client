import { defineConfig } from "vite";
import * as remix from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from "./load-context";
import browserslistToEsbuild from "browserslist-to-esbuild";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		remix.cloudflareDevProxyVitePlugin({ getLoadContext }),
		remix.vitePlugin({
			future: {
				v3_fetcherPersist: true,
				v3_relativeSplatPath: true,
				v3_throwAbortReason: true,
			},
		}),
	],
	build: {
		target: browserslistToEsbuild([
			"last 2 chrome versions",
			"last 2 firefox versions",
			"last 2 edge versions",
			"last 2 safari versions",
		]),
	},
	clearScreen: false,
});
