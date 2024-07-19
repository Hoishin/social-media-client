import { RemixBrowser } from "@remix-run/react";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next/client";

import { bundleBackend } from "./i18next/backend";
import { i18nextOptions } from "./i18next/options";

await i18next
	.use(initReactI18next)
	.use(LanguageDetector)
	.use(bundleBackend)
	.init({
		...i18nextOptions,
		ns: getInitialNamespaces(),
		detection: {
			order: ["htmlTag"],
			caches: [],
		},
	});

startTransition(() => {
	hydrateRoot(
		document,
		<I18nextProvider i18n={i18next}>
			<StrictMode>
				<RemixBrowser />
			</StrictMode>
		</I18nextProvider>,
	);
});
