import "./tailwind.css";

import type {
	MetaFunction,
	LinksFunction,
	LoaderFunctionArgs,
} from "@remix-run/node";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	json,
	useRouteLoaderData,
} from "@remix-run/react";
import { remixI18next } from "./i18next/remix-i18next.server";
import { useTranslation } from "react-i18next";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";

export const meta: MetaFunction = () => [
	{ charSet: "utf-8" },
	{ title: "Socials Client" },
	{ name: "viewport", content: "width=device-width, initial-scale=1" },
];

export const links: LinksFunction = () => [{ rel: "icon", href: "data:," }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const [locale] = await Promise.all([remixI18next.getLocale(request)]);
	return json({ locale });
};

export const Layout = ({ children }: PropsWithChildren) => {
	const { i18n } = useTranslation();
	const data = useRouteLoaderData<typeof loader>("root");

	return (
		<html lang={data?.locale} dir={i18n.dir()}>
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				<ThemeProvider attribute="class">
					{children}
					<div id="spinner-portal" />
				</ThemeProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
};

export default function Root() {
	return <Outlet />;
}
