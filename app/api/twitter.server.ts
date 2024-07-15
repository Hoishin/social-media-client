import { env } from "../lib/env.server.js";
import { prisma } from "../lib/prisma.server.js";
import ky from "ky";
import { uint8ArrayToBase64 } from "uint8array-extras";

const apiKy = ky.create({
	prefixUrl: env.TWITTER_MANAGE_ORIGIN,
	headers: { Authorization: env.TWITTER_MANAGE_AUTH },
});

const getLatestSession = async () => {
	const session = await prisma.twitterManageSession.findFirst({
		orderBy: { createdAt: "desc" },
		select: { id: true, status: true },
	});
	if (!session) {
		throw new Error("no session");
	}
	return session;
};

const getSessionStatus = async (id: string) => {
	const { status } = await apiKy
		.post("get-status", {
			json: { sessionId: id },
		})
		.json<{ status: "loggedIn" | "waitingForConfirmationCode" }>();
	return status;
};

export const initialize = async () => {
	const { id, status } = await apiKy
		.post("create-session", {
			json: {
				username: env.TWITTER_USERNAME,
				password: env.TWITTER_PASSWORD,
				email: env.TWITTER_USER_EMAIL,
			},
		})
		.json<{ id: string; status: "loggedIn" | "waitingForConfirmationCode" }>();
	await prisma.twitterManageSession.upsert({
		where: { id },
		update: { status },
		create: { id, status },
	});
};

export const getStatus = async () => {
	const latestSession = await getLatestSession();
	const status = await getSessionStatus(latestSession.id);
	return status;
}

export const inputConfirmationCode = async (code: string) => {
	const twitterSession = await prisma.twitterManageSession.findFirst({
		orderBy: { createdAt: "desc" },
		select: { id: true },
	});
	if (!twitterSession) {
		throw new Error("no session");
	}
	const status = await getSessionStatus(twitterSession.id);
	if (status !== "waitingForConfirmationCode") {
		throw new Error("latest session is already logged in");
	}
	await apiKy
		.post("input-confirmation-code", {
			json: { sessionId: twitterSession.id, code },
		})
		.json<void>();
};

export const getTweets = async () => {
	const latestSession = await getLatestSession();
	if (latestSession.status !== "loggedIn") {
		throw new Error("session is not logged in");
	}
	const tweets = await apiKy
		.post("get-tweets", { json: { sessionId: latestSession.id } })
		.json<{ tweetId: string; text: string; tweetedAt: Date }[]>();

	await prisma.$transaction(async (tx) => {
		await Promise.all(
			tweets.map((tweet) =>
				tx.tweets.upsert({
					where: { tweetId: tweet.tweetId },
					update: { text: tweet.text, tweetedAt: tweet.tweetedAt },
					create: tweet,
				})
			)
		);
	});
};

export const tweet = async (text: string, files: Uint8Array[]) => {
	const latestSession = await getLatestSession();
	if (latestSession.status !== "loggedIn") {
		throw new Error("session is not logged in");
	}
	await apiKy.post("tweet", {
		json: {
			sessionId: latestSession.id,
			text,
			files: files.map((file) => uint8ArrayToBase64(file)),
		},
	});
};

export const deleteTweet = async (tweetId: string) => {
	const latestSession = await getLatestSession();
	if (latestSession.status !== "loggedIn") {
		throw new Error("session is not logged in");
	}
	await apiKy.post("delete-tweet", {
		json: {
			sessionId: latestSession.id,
			tweetId,
		},
	});
};

export const sendReply = async (
	tweetId: string,
	text: string,
	files: Uint8Array[]
) => {
	const latestSession = await getLatestSession();
	if (latestSession.status !== "loggedIn") {
		throw new Error("session is not logged in");
	}
	await apiKy.post("reply", {
		json: {
			sessionId: latestSession.id,
			tweetId,
			text,
			files: files.map((file) => uint8ArrayToBase64(file)),
		},
	});
};
