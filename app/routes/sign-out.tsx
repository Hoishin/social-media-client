import { redirect } from "@remix-run/node";
import { sessionCookie } from "../lib/cookies.server";

export const action = async () => {
	const setCookie = await sessionCookie.serialize("", {
		maxAge: 0,
	});
	throw redirect("/sign-in", {
		headers: {
			"Set-Cookie": setCookie,
		},
	});
};
