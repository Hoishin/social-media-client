import type { PrismaClient } from "@prisma/client";
import ky, { HTTPError } from "ky";

export const setupTwitterClient = ({
	manageOrigin,
	manageAuth,
	username,
	password,
	email,
	db,
}: {
	manageOrigin: string;
	manageAuth: string;
	username: string;
	password: string;
	email: string;
	db: PrismaClient;
}) => {
	const apiKy = ky.create({
		prefixUrl: manageOrigin,
		headers: { Authorization: manageAuth },
	});

	const createSession = async () => {
		const { id, status } = await apiKy
			.post("create-session", {
				json: { username, password, email },
			})
			.json<{
				id: string;
				status: "loggedIn" | "waitingForConfirmationCode";
			}>();
		await db.twitterManageSession.create({
			data: { id },
		});
		return { id, status };
	};

	const getSessionStatus = async (id: string) => {
		const { status } = await apiKy
			.post("get-status", {
				json: { sessionId: id },
			})
			.json<{ status: "loggedIn" | "waitingForConfirmationCode" }>();
		return status;
	};

	const getOrCreateSession = async () => {
		const latestSavedSession = await db.twitterManageSession.findFirst({
			orderBy: { createdAt: "desc" },
			select: { id: true },
		});

		if (!latestSavedSession) {
			const session = await createSession();
			return session;
		}

		const status = await getSessionStatus(latestSavedSession.id).catch(
			(error) => {
				if (error instanceof HTTPError && error.response.status === 404) {
					return null;
				}
				throw error;
			}
		);

		if (status === "waitingForConfirmationCode" || status === "loggedIn") {
			return { id: latestSavedSession.id, status };
		}

		const session = await createSession();
		return session;
	};

	const inputConfirmationCode = async (code: string) => {
		const session = await getOrCreateSession();
		if (session.status !== "waitingForConfirmationCode") {
			throw new Error("latest session is already logged in");
		}
		await apiKy
			.post("input-confirmation-code", {
				json: { sessionId: session.id, code },
			})
			.json<void>();
	};

	const getTweets = async () => {
		const session = await getOrCreateSession();
		if (session.status !== "loggedIn") {
			throw new Error("session is not logged in");
		}
		const tweets = await apiKy
			.post("get-tweets", { json: { sessionId: session.id } })
			.json<{ tweetId: string; text: string; tweetedAt: Date }[]>();

		await db.$transaction(async (tx) => {
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

	const tweet = async (text: string, files: string[]) => {
		const session = await getOrCreateSession();
		if (session.status !== "loggedIn") {
			throw new Error("session is not logged in");
		}
		await apiKy.post("tweet", {
			json: {
				sessionId: session.id,
				text,
				files,
			},
		});
	};

	const deleteTweet = async (tweetId: string) => {
		const session = await getOrCreateSession();
		if (session.status !== "loggedIn") {
			throw new Error("session is not logged in");
		}
		await apiKy.post("delete-tweet", {
			json: {
				sessionId: session.id,
				tweetId,
			},
		});
		await db.tweets.delete({ where: { tweetId } });
	};

	const sendReply = async (tweetId: string, text: string, files: string[]) => {
		const session = await getOrCreateSession();
		if (session.status !== "loggedIn") {
			throw new Error("session is not logged in");
		}
		await apiKy.post("tweet", {
			json: {
				sessionId: session.id,
				replyToTweetId: tweetId,
				text,
				files,
			},
		});
	};

	const getStatus = async () => {
		const session = await getOrCreateSession();
		return session.status;
	};

	return {
		getStatus,
		inputConfirmationCode,
		getTweets,
		tweet,
		deleteTweet,
		sendReply,
	};
};
