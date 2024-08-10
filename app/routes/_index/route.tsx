import { assertSession } from "../../lib/session.server";
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
import { post } from "../../api/bluesky.server";
import { uint8ArrayToBase64 } from "uint8array-extras";

interface Post {
	twitterId?: string;
	blueskyId?: string;
	text: string;
	postedAt: Date;
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
	const [session, tweets, blueskyPosts] = await Promise.all([
		assertSession(request, context),
		context.db.tweets.findMany({
			orderBy: {
				tweetedAt: "desc",
			},
			take: 100,
		}),
		context.db.blueskyPosts.findMany({
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
		twitterUsername: context.twitter.enabled
			? context.twitter.username
			: undefined,
		blueskyUsername: context.bluesky.enabled
			? context.bluesky.username
			: undefined,
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
	twitter: zfd.checkbox(),
	bluesky: zfd.checkbox(),
	replyTwitterId: zfd.text(z.string().optional()),
	replyBlueskyId: zfd.text(z.string().optional()),
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
	await assertSession(request, context);

	try {
		const formData = await unstable_parseMultipartFormData(
			request,
			unstable_composeUploadHandlers(async ({ data, name }) => {
				if (name !== "files") {
					return undefined;
				}
				let base64 = "";
				for await (const chunk of data) {
					base64 += uint8ArrayToBase64(chunk);
				}
				return base64;
			}, unstable_createMemoryUploadHandler())
		);

		const { text, twitter, bluesky, replyTwitterId, replyBlueskyId } =
			actionSchema.parse(formData);

		const files = formData.getAll("files");
		const fileArray: string[] = [];
		for (const file of files) {
			if (typeof file === "string" && file) {
				fileArray.push(file);
			}
		}

		if (
			typeof replyTwitterId === "string" ||
			typeof replyBlueskyId === "string"
		) {
			await Promise.all([
				twitter &&
					replyTwitterId &&
					context.twitter.enabled &&
					context.twitter.sendReply(replyTwitterId, text ?? "", fileArray),
				bluesky &&
					replyBlueskyId &&
					context.bluesky.enabled &&
					post(
						context.bluesky.agent,
						context.bluesky.selfDid,
						context.db,
						text ?? "",
						fileArray,
						replyBlueskyId
					),
			]);
		} else {
			await Promise.all([
				twitter &&
					context.twitter.enabled &&
					context.twitter.tweet(text ?? "", fileArray),
				bluesky &&
					context.bluesky.enabled &&
					post(
						context.bluesky.agent,
						context.bluesky.selfDid,
						context.db,
						text ?? "",
						fileArray
					),
			]);
		}

		return json({ ok: true, data: text } as const);
	} catch (error) {
		console.error(error);
		const message = error instanceof Error ? error.message : String(error);
		return json({ ok: false, error: message } as const, { status: 500 });
	}
};
