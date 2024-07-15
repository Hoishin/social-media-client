import { redirect } from "@remix-run/node";
import { validateSession } from "./validate-session.server";
import { sessionCookie } from "../lib/cookies.server";

export const parseSession = async (request: Request) => {
	const sessionToken: unknown = await sessionCookie.parse(
		request.headers.get("Cookie")
	);
	if (typeof sessionToken !== "string") {
		return null;
	}
	const session = await validateSession(sessionToken);
	if (!session) {
		return null;
	}
	return {
		id: session.id,
		username: session.discordUsername,
	};
};

export const assertSession = async (request: Request) => {
	const session = await parseSession(request);
	if (!session) {
		throw redirect("/sign-in");
	}
	return session;
};
