import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import {
	createCookie,
	createWorkersKVSessionStorage,
} from "@remix-run/cloudflare";
import ky, { HTTPError } from "ky";
import { Authenticator } from "remix-auth";
import { DiscordStrategy } from "remix-auth-discord";
import { type PlatformProxy } from "wrangler";

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
	interface AppLoadContext {
		db: PrismaClient;
		auth: Authenticator<Session>;
	}
}

type Session = Readonly<{ discordId: string; displayName: string }>;

export const getLoadContext = ({
	context: { cloudflare },
}: {
	context: { cloudflare: Cloudflare };
}) => {
	const db = new PrismaClient({ adapter: new PrismaD1(cloudflare.env.DB) });

	const sessionStorage = createWorkersKVSessionStorage({
		kv: cloudflare.env.SESSION_KV,
		cookie: createCookie("session", {
			secure: cloudflare.env.LOCAL !== "true",
			httpOnly: true,
			path: "/",
			secrets: [cloudflare.env.SESSION_COOKIE_SECRET],
			maxAge: 60 * 60 * 24 * 14,
		}),
	});

	const auth = new Authenticator<Session>(sessionStorage);

	const discordStrategy = new DiscordStrategy(
		{
			clientID: cloudflare.env.DISCORD_CLIENT_ID,
			clientSecret: cloudflare.env.DISCORD_CLIENT_SECRET,
			callbackURL: "/sign-in/callback/discord",
			scope: ["identify"],
		},
		async ({ profile, accessToken }) => {
			const validRoles = new Set<string>(cloudflare.env.DISCORD_VALID_ROLE_IDS);
			const userGuild = await ky
				.get(
					`https://discord.com/api/users/@me/guilds/${cloudflare.env.DISCORD_SERVER_ID}/member`,
					{ headers: { authorization: `Bearer ${accessToken}` } }
				)
				.json<{ roles: string[] }>()
				.catch(async (error) => {
					if (!(error instanceof HTTPError)) {
						throw error;
					}
					const responseData = await error.response.text();
					console.error("failed to get user info", responseData);
					if (error.response.status === 404) {
						throw new Error("not in the server");
					}
					throw new Error("failed to get user info");
				});
			const isValidUser = userGuild.roles.some((role) => validRoles.has(role));
			if (!isValidUser) {
				throw new Error("no sufficient roles");
			}
			return { discordId: profile.id, displayName: profile.displayName };
		}
	);

	auth.use(discordStrategy);

	return { db, auth };
};
