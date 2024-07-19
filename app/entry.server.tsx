import type { AppLoadContext, EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { createInstance } from "i18next";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";

import { bundleBackend } from "./i18next/backend";
import { i18nextOptions } from "./i18next/options";
import { remixI18next } from "./i18next/remix-i18next.server";

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
	_loadContext: AppLoadContext,
) {
	const i18nextInstance = createInstance();
	const lng = await remixI18next.getLocale(request);
	const ns = remixI18next.getRouteNamespaces(remixContext);

	await i18nextInstance
		.use(initReactI18next)
		.use(bundleBackend)
		.init({
			...i18nextOptions,
			lng,
			ns,
		});

	const body = await renderToReadableStream(
		<I18nextProvider i18n={i18nextInstance}>
			<RemixServer context={remixContext} url={request.url} />
		</I18nextProvider>,
		{
			signal: request.signal,
			onError(error: unknown) {
				// Log streaming rendering errors from inside the shell
				console.error(error);
				responseStatusCode = 500;
			},
		},
	);

	if (isbot(request.headers.get("user-agent") ?? "")) {
		await body.allReady;
	}

	responseHeaders.set("Content-Type", "text/html");
	return new Response(body, {
		headers: responseHeaders,
		status: responseStatusCode,
	});
}
