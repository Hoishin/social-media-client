import { createCookie } from "@remix-run/node";
import { env } from "./env.server";

export const sessionCookie = createCookie("app_session_token", {
	path: "/",
	httpOnly: true,
	sameSite: "lax",
	maxAge: 24 * 60 * 60,
	secure: env.NODE_ENV === "production",
});

export const discordOauthStateCookie = createCookie("discord_oauth_state", {
	path: "/",
	httpOnly: true,
	sameSite: "lax",
	maxAge: 10 * 60,
	secure: env.NODE_ENV === "production",
});
