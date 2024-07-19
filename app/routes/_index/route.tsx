import { assertSession } from "../../lib/session.server";
import { prisma } from "../../lib/prisma.server";
import { env } from "../../lib/env.server";
import { TweetForm } from "./tweet-form";
import { TweetList } from "./tweet-list";
import {
	type ActionFunctionArgs,
	unstable_parseMultipartFormData,
	unstable_composeUploadHandlers,
	unstable_createMemoryUploadHandler,
	json,
	type LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { sendReply, tweet } from "../../api/twitter.server";
import { tmpDir } from "../../lib/tmp-dir.server";
import { getBlueskyEnabled, post } from "../../api/bluesky.server";
import fs from "node:fs/promises";

interface Post {
	twitterId?: string;
	blueskyId?: string;
	text: string;
	postedAt: Date;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const [session, tweets, blueskyPosts] = await Promise.all([
		assertSession(request),
		prisma.tweets.findMany({
			orderBy: {
				tweetedAt: "desc",
			},
			take: 100,
		}),
		prisma.blueskyPosts.findMany({
			orderBy: {
				postedAt: "desc",
			},
			take: 100,
		}),
	]);

	const posts: Post[] = [];
	for (const tweet of tweets) {
		posts.push({
			twitterId: tweet.tweetId,
			text: tweet.text,
			postedAt: tweet.tweetedAt,
		});
	}
	for (const blueskyPost of blueskyPosts) {
		const postWithSameText = posts.find(
			(p) =>
				p.text.replace(/\r?\n/g, "") ===
					blueskyPost.text.replace(/\r?\n/g, "") &&
				Math.abs(p.postedAt.getTime() - blueskyPost.postedAt.getTime()) <
					60 * 1000
		);
		if (postWithSameText) {
			postWithSameText.blueskyId = blueskyPost.postId;
		} else {
			posts.push({
				blueskyId: blueskyPost.postId,
				text: blueskyPost.text,
				postedAt: blueskyPost.postedAt,
			});
		}
	}

	posts.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

	return json({
		session,
		posts,
		twitterUsername: env.TWITTER_USERNAME,
		blueskyUsername: env.BLUESKY_USERNAME,
	});
};

export default function IndexPage() {
	return (
		<>
			<TweetForm />
			<TweetList />
		</>
	);
}

const actionSchema = zfd.formData({
	text: zfd.text(z.string().optional()),
	service: zfd.repeatableOfType(zfd.text(z.enum(["twitter", "bluesky"]))),
	replyTwitterId: zfd.text(z.string().optional()),
	replyBlueskyId: zfd.text(z.string().optional()),
});

const twitterEnabled = Boolean(env.TWITTER_USERNAME && env.TWITTER_PASSWORD);

export const action = async ({ request }: ActionFunctionArgs) => {
	await assertSession(request);

	try {
		const formData = await unstable_parseMultipartFormData(
			request,
			unstable_composeUploadHandlers(
				unstable_createFileUploadHandler({
					maxPartSize: 100_000_000,
					directory: tmpDir,
				}),
				unstable_createMemoryUploadHandler()
			)
		);

		const { text, service, replyTwitterId, replyBlueskyId } =
			actionSchema.parse(formData);

		const postOnTwitter = service.includes("twitter");
		const postOnBluesky = service.includes("bluesky");

		const files = formData.getAll("files");
		const filePaths: string[] = [];
		for (const file of files) {
			if (file instanceof NodeOnDiskFile) {
				filePaths.push(file.getFilePath());
			}
		}

		if (
			typeof replyTwitterId === "string" ||
			typeof replyBlueskyId === "string"
		) {
			await Promise.all([
				postOnTwitter &&
					replyTwitterId &&
					twitterEnabled &&
					sendReply(replyTwitterId, text ?? "", []), // TODO: files
				postOnBluesky &&
					replyBlueskyId &&
					getBlueskyEnabled() &&
					post(text ?? "", filePaths, replyBlueskyId),
			]);
		} else {
			await Promise.all([
				postOnTwitter && twitterEnabled && tweet(text ?? "", []), // TODO: files
				postOnBluesky && getBlueskyEnabled() && post(text ?? "", filePaths),
			]);
		}

		await Promise.all(filePaths.map((filePath) => fs.rm(filePath)));

		return json({ ok: true, data: text } as const);
	} catch (error) {
		console.error(error);
		const message = error instanceof Error ? error.message : String(error);
		return json({ ok: false, error: message } as const, { status: 500 });
	}
};
