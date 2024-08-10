import { type AppLoadContext } from "@remix-run/cloudflare";

export const parseSession = async (
	request: Request,
	context: AppLoadContext
) => {
	const session = await context.auth.isAuthenticated(request);
	return session;
};

export const assertSession = async (
	request: Request,
	context: AppLoadContext
) => {
	const session = await context.auth.isAuthenticated(request, {
		failureRedirect: "/sign-in",
	});
	return session;
};
