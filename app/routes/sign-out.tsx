import { type ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ request, context }: ActionFunctionArgs) => {
	return context.auth.logout(request, { redirectTo: "/sign-in" });
};
