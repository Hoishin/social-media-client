import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { zfd } from "zod-form-data";
import { assertSession } from "../lib/session.server";
import { deletePost } from "../api/bluesky.server";

const actionSchema = zfd.formData({
	twitterId: zfd.text().optional(),
	blueskyId: zfd.text().optional(),
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
	await assertSession(request, context);

	const data = actionSchema.parse(await request.formData());

	await Promise.all([
		data.twitterId &&
			context.twitter.enabled &&
			context.twitter.deleteTweet(data.twitterId),
		data.blueskyId &&
			context.bluesky.enabled &&
			deletePost(context.bluesky.agent, data.blueskyId),
		data.blueskyId &&
			context.db.blueskyPosts.delete({ where: { postId: data.blueskyId } }),
	]);

	return json(null);
};
