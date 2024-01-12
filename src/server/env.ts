import { z } from "zod";

const envSchema = z.object({
	DISCORD_CLIENT_ID: z.string(),
	DISCORD_CLIENT_SECRET: z.string(),

	NODE_ENV: z.enum(["development", "production"]).default("development"),

	SERVER_PORT: z.coerce.number().default(3000),
	SERVER_HOSTNAME: z.string().default("localhost"),
	SERVER_ORIGIN: z.string().default("http://localhost:3000"),
	CLIENT_ORIGIN: z.string().default("http://localhost:5173"),

	DISCORD_SERVER_ID: z.string(),
	DISCORD_VALID_ROLE_IDS: z.string(),

	TWITTER_USERNAME: z.string(),
	TWITTER_PASSWORD: z.string(),
});

export const env = envSchema.parse(process.env);
