import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { discordOauthStateCookie } from "../lib/cookies.server";
import { env } from "../lib/env.server";
import { randomBytes } from "crypto";
import { parseSession } from "../lib/session.server";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const discordOauthRedirectUrl = new URL("/validate-oauth", env.SERVER_ORIGIN);

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const session = await parseSession(request);
	if (session) {
		throw redirect("/");
	}
	return null;
};

export default () => {
	const { t } = useTranslation();
	return (
		<div className="grid place-items-center">
			<Form method="post">
				<Button type="submit">{t("signInWithDiscord")}</Button>
			</Form>
		</div>
	);
};

export const action = async () => {
	const state = randomBytes(100).toString("base64url");

	const url = new URL("https://discord.com/oauth2/authorize");
	url.searchParams.append("response_type", "code");
	url.searchParams.append("client_id", env.DISCORD_CLIENT_ID);
	url.searchParams.append("scope", "identify guilds.members.read");
	url.searchParams.append("state", state);
	url.searchParams.append("redirect_uri", discordOauthRedirectUrl.href);

	throw redirect(url.href, {
		headers: {
			"Set-Cookie": await discordOauthStateCookie.serialize(state),
		},
	});
};
