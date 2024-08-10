import type { BskyAgent } from "@atproto/api";
import sharp from "sharp";
import { isThreadViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { base64ToUint8Array } from "uint8array-extras";
import type { PrismaClient } from "@prisma/client";

export const getPosts = async (
	agent: BskyAgent,
	selfDid: string,
	db: PrismaClient
) => {
	try {
		const feed = await agent.getAuthorFeed({
			actor: selfDid,
			filter: "posts_and_author_threads",
			limit: 100,
		});
		await Promise.all(
			feed.data.feed.map(async ({ post }) => {
				const id = post.uri;
				const record = post.record as { text: string; createdAt: string };
				const text = record.text;
				const createdAt = new Date(record.createdAt);
				await db.blueskyPosts.upsert({
					create: {
						postId: id,
						text,
						postedAt: createdAt,
					},
					where: { postId: id },
					update: {
						text,
						postedAt: createdAt,
					},
				});
			})
		);
	} catch (error) {
		console.error(error);
	}
};

const FILE_SIZE_LIMIT = 1_000_000; // 1 million bytes or 976.56 KB

const scaleImage = async (input: Uint8Array, quality = 100) => {
	const output = await sharp(input)
		.toFormat("jpeg")
		.jpeg({ quality })
		.toBuffer();
	if (output.byteLength < FILE_SIZE_LIMIT) {
		return output;
	}
	return scaleImage(input, quality - 5);
};

const uploadFile = async (agent: BskyAgent, fileBase64: string) => {
	const output = await scaleImage(base64ToUint8Array(fileBase64));
	const res = await agent.uploadBlob(output, { encoding: "image/jpeg" });
	return res.data.blob;
};

export const post = async (
	agent: BskyAgent,
	selfDid: string,
	db: PrismaClient,
	text: string,
	files: string[],
	replyTo?: string
) => {
	const replyPostThreadData = replyTo
		? await agent.getPostThread({ uri: replyTo })
		: null;

	const replyPost =
		replyPostThreadData && isThreadViewPost(replyPostThreadData.data.thread)
			? replyPostThreadData.data.thread.post
			: null;

	const replyPostRecord = replyPost?.record as
		| { reply?: { root?: { uri: string; cid: string } } }
		| undefined;
	const rootPost = replyPostRecord?.reply?.root ?? replyPost;

	const uploadResults = await Promise.all(
		files.map((file) => uploadFile(agent, file))
	);
	await agent.post({
		text,
		embed: {
			$type: "app.bsky.embed.images",
			images: uploadResults.map((result) => ({
				image: result,
				alt: "", // TODO: allow setting alt text
			})),
		},
		reply:
			replyPost && rootPost
				? {
						parent: { uri: replyPost.uri, cid: replyPost.cid },
						root: { uri: rootPost.uri, cid: rootPost.cid },
				  }
				: undefined,
	});
	await getPosts(agent, selfDid, db);
};

export const deletePost = async (agent: BskyAgent, postId: string) => {
	await agent.deletePost(postId);
};
