import { json, type ActionFunctionArgs } from "@remix-run/node";
import { deleteTweet } from "../api/twitter.server";
import { prisma } from "../lib/prisma.server";
import { zfd } from "zod-form-data";
import { assertSession } from "../lib/session.server";
import { deletePost } from "../api/bluesky.server";

const actionSchema = zfd.formData({
	twitterId: zfd.text().optional(),
	blueskyId: zfd.text().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
	await assertSession(request);

	const data = actionSchema.parse(await request.formData());

	await Promise.all([
		data.twitterId && deleteTweet(data.twitterId),
		data.twitterId &&
			prisma.tweets.delete({ where: { tweetId: data.twitterId } }),
		data.blueskyId && deletePost(data.blueskyId),
		data.blueskyId &&
			prisma.blueskyPosts.delete({ where: { postId: data.blueskyId } }),
	]);

	return json(null);
};
