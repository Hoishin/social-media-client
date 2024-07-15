import { useReplyStore } from "./reply-store";
import { useFetcher, useLoaderData } from "@remix-run/react";
import type { loader } from "./route";
import { useTranslation } from "react-i18next";
import { ClientOnly } from "../../components/client-only";
import twitterLogo from "./twitter-logo.png";
import blueskyLogo from "./bluesky-logo.png";
import { FullscreenSpinner } from "../../components/fullscreen-spinner";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import clsx from "clsx";

const PostBodyText = ({ children }: { children: string }) => {
	const lines = children.split(/\r?\n/g);
	return (
		<div className="break-anywhere">
			{lines.map((line, i) => (
				<Fragment key={i}>
					{i > 0 && <br />}
					{line}
				</Fragment>
			))}
		</div>
	);
};

const DeletePostButton = ({
	twitterId,
	blueskyId,
}: {
	twitterId?: string;
	blueskyId?: string;
}) => {
	const fetcher = useFetcher();
	const { t } = useTranslation();
	const sending = fetcher.state === "submitting";

	return (
		<>
			<fetcher.Form
				method="post"
				action={`/delete-post`}
				onSubmit={(e) => {
					if (!confirm("Are you sure to delete this post?")) {
						e.preventDefault();
					}
				}}
			>
				{twitterId && (
					<input type="hidden" name="twitterId" value={twitterId} />
				)}
				{blueskyId && (
					<input type="hidden" name="blueskyId" value={blueskyId} />
				)}
				<Button type="submit">{t("delete")}</Button>
			</fetcher.Form>
			<FullscreenSpinner show={sending} />
		</>
	);
};

export const TweetList = () => {
	const data = useLoaderData<typeof loader>();
	const setReply = useReplyStore((store) => store.setReply);
	const replyTwitterId = useReplyStore((store) => store.twitterId);
	const replyBlueskyId = useReplyStore((store) => store.blueskyId);
	const { t } = useTranslation();

	return (
		<div className="grid gap-2">
			{data.posts.map((post) => (
				<Card
					key={(post.twitterId ?? "") + (post.blueskyId ?? "")}
					className={clsx(
						typeof post.twitterId === "string" &&
							replyTwitterId === post.twitterId &&
							"border border-solid border-red-600",
						typeof post.blueskyId === "string" &&
							replyBlueskyId === post.blueskyId &&
							"border border-solid border-red-600"
					)}
				>
					<CardHeader>
						<div className="flex gap-2">
							{post.twitterId && (
								<a
									href={`https://x.com/${data.twitterUsername}/status/${post.twitterId}`}
									target="_blank"
								>
									<Avatar className="w-8 h-8">
										<AvatarImage
											src={twitterLogo}
											alt="Twitter"
											className="w-8 h-8"
										/>
										<AvatarFallback>Twitter</AvatarFallback>
									</Avatar>
								</a>
							)}
							{post.blueskyId && (
								<a
									href={`https://bsky.app/profile/${
										data.blueskyUsername
									}/post/${post.blueskyId.split("/").at(-1)}`}
									target="_blank"
								>
									<Avatar className="w-8 h-8">
										<AvatarImage
											src={blueskyLogo}
											alt="Bluesky"
											className="w-8 h-8"
										/>
										<AvatarFallback>Bluesky</AvatarFallback>
									</Avatar>
								</a>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<PostBodyText>{post.text}</PostBodyText>
					</CardContent>
					<CardFooter className="grid gap-2 grid-flow-col grid-cols-[1fr_auto_auto] items-end">
						<div className="grid">
							<ClientOnly>
								{new Date(post.postedAt).toLocaleString()}
							</ClientOnly>
						</div>
						<Button
							onClick={() => {
								setReply({
									twitterId: post.twitterId,
									blueskyId: post.blueskyId,
								});
							}}
						>
							{t("reply")}
						</Button>
						<DeletePostButton
							twitterId={post.twitterId}
							blueskyId={post.blueskyId}
						/>
					</CardFooter>
				</Card>
			))}
		</div>
	);
};
