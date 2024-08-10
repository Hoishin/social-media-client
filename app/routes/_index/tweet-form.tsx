import { useReplyStore } from "./reply-store";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useId, useState } from "react";
import twitterText from "twitter-text";
import type { loader, action } from "./route";
import { useTranslation } from "react-i18next";
import { FullscreenSpinner } from "../../components/fullscreen-spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const imageFileTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const videoFileTypes = ["video/mp4", "video/quicktime"];

const TweetTextInput = () => {
	const [tweetLength, setTweetLength] = useState(0);
	return (
		<>
			<Textarea
				name="text"
				onChange={(e) => {
					setTweetLength(twitterText.getTweetLength(e.target.value));
				}}
				className="h-[150px] w-full"
			/>
			<div className="justify-self-end">{tweetLength}/280</div>
		</>
	);
};

const ImageFileInput = () => {
	const inputId = useId();
	const [files, setFiles] = useState<File[] | null>(null);
	const { t } = useTranslation();

	return (
		<div className="grid gap-2">
			<div>
				<Button asChild className="justify-self-start">
					<label htmlFor={inputId}>{t("uploadMedia")}</label>
				</Button>
				<input
					name="files"
					type="file"
					hidden
					accept={[...imageFileTypes, ...videoFileTypes].join(",")}
					multiple
					id={inputId}
					onChange={(e) => {
						setFiles(e.target.files ? Array.from(e.target.files) : null);
					}}
				/>
			</div>
			<div className="grid grid-cols-[auto_auto] grid-rows-[auto_auto] gap-1">
				{files?.map((file) =>
					imageFileTypes.includes(file.type) ? (
						<img
							key={file.name}
							src={URL.createObjectURL(file)}
							alt={file.name}
						/>
					) : (
						<video
							key={file.name}
							src={URL.createObjectURL(file)}
							controls
							muted
						/>
					)
				)}
			</div>
		</div>
	);
};

const ReplyDisplay = () => {
	const replyTwitterId = useReplyStore((store) => store.twitterId);
	const replyBlueskyId = useReplyStore((store) => store.blueskyId);
	const clearReply = useReplyStore((store) => store.clearReply);
	const { t } = useTranslation();

	if (!replyTwitterId && !replyBlueskyId) {
		return;
	}

	return (
		<div className="text-red-600 grid gap-2 grid-cols-[1fr_auto] items-center">
			<input type="hidden" name="replyTwitterId" value={replyTwitterId} />
			<input type="hidden" name="replyBlueskyId" value={replyBlueskyId} />
			<div>{t("tweetAsReply")}</div>
			<Button
				onClick={() => {
					clearReply();
				}}
			>
				{t("clear")}
			</Button>
		</div>
	);
};

const ServiceSelect = () => {
	const data = useLoaderData<typeof loader>();
	const serviceDefaultValue = [];
	if (data.twitterUsername) {
		serviceDefaultValue.push("twitter");
	}
	if (data.blueskyUsername) {
		serviceDefaultValue.push("bluesky");
	}

	return (
		<>
			{data.twitterUsername && (
				<label className="grid grid-flow-col justify-start gap-1 items-center">
					<Checkbox
						name="twitter"
						defaultChecked={Boolean(data.twitterUsername)}
					/>
					<span>
						Twitter:&nbsp;
						<a
							href={`https://x.com/${data.twitterUsername}`}
							target="_blank"
							className="font-medium text-primary underline underline-offset-4"
						>
							@{data.twitterUsername}
						</a>
					</span>
				</label>
			)}
			{data.blueskyUsername && (
				<label className="grid grid-flow-col justify-start gap-1 items-center">
					<Checkbox
						name="bluesky"
						defaultChecked={Boolean(data.blueskyUsername)}
					/>
					<span>
						Bluesky:&nbsp;
						<a
							href={`https://bsky.app/profile/${data.blueskyUsername}`}
							target="_blank"
							className="font-medium text-primary underline underline-offset-4"
						>
							@{data.blueskyUsername}
						</a>
					</span>
				</label>
			)}
		</>
	);
};

export const TweetForm = () => {
	const fetcher = useFetcher<typeof action>();
	const sending = fetcher.state === "submitting";
	const { t } = useTranslation();

	const [formKey, setFormKey] = useState(0);
	const clearReply = useReplyStore((store) => store.clearReply);
	useEffect(() => {
		if (fetcher.state === "loading" && fetcher.data?.ok) {
			setFormKey((key) => key + 1);
			clearReply();
		}
	}, [fetcher.state, fetcher.data?.ok, clearReply]);

	return (
		<>
			{fetcher.data?.ok === false && (
				<div className="text-red-600">
					{t("tweetFailed")}: {fetcher.data.error}
				</div>
			)}
			<fetcher.Form
				method="post"
				encType="multipart/form-data"
				className="grid gap-2"
				key={formKey}
			>
				<ServiceSelect />
				<ReplyDisplay />
				<TweetTextInput />
				<ImageFileInput />
				<Button type="submit" className="justify-self-end">
					{t("submit")}
				</Button>
			</fetcher.Form>
			<FullscreenSpinner show={sending} />
		</>
	);
};
