import "./tailwind.css";

import type {
	MetaFunction,
	LinksFunction,
	LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	json,
	useLoaderData,
	useRouteLoaderData,
} from "@remix-run/react";
import { remixI18next } from "./i18next/remix-i18next.server";
import { useTranslation } from "react-i18next";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
import { parseSession } from "./lib/session.server";
import { ThemeModeToggle } from "./components/theme-mode-toggle";
import { SignOutButton } from "./routes/_index/sign-out-button";

export const meta: MetaFunction = () => [
	{ charSet: "utf-8" },
	{ title: "Socials Client" },
	{ name: "viewport", content: "width=device-width, initial-scale=1" },
];

export const links: LinksFunction = () => [{ rel: "icon", href: "data:," }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const [locale, session] = await Promise.all([
		remixI18next.getLocale(request),
		parseSession(request),
	]);
	return json({ locale, session });
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
				<ThemeProvider attribute="class">{children}</ThemeProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
};

const Header = () => {
	const { session } = useLoaderData<typeof loader>();
	const { t } = useTranslation();
	if (!session) {
		return (
			<header className="grid justify-end">
				<ThemeModeToggle />
			</header>
		);
	}
	return (
		<header className="flex gap-2">
			<div className="grow">
				{t("signedInAs", { username: session.username })}
			</div>
			<ThemeModeToggle />
			<SignOutButton />
		</header>
	);
};

export default function Root() {
	return (
		<div className="w-screen h-screen grid justify-center">
			<div className="p-2 grid content-start gap-2 max-w-[100vw] w-[480px]">
				<Header />
				<Outlet />
				<div id="spinner-portal" />
			</div>
		</div>
	);
}
