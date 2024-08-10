import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { assertSession } from "../lib/session.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
	await assertSession(request, context);
	if (!context.twitter.enabled) {
		throw redirect("/");
	}
	const status = await context.twitter.getStatus();
	if (status !== "waitingForConfirmationCode") {
		throw redirect("/");
	}
	return json(null);
};

export default function ConfirmationCodePage() {
	return (
		<div className="grid justify-center">
			<Form method="post" className="grid gap-2">
				<label>
					Confirmation Code
					<Input name="code" />
				</label>
				<Button type="submit" className="justify-self-end">
					Submit
				</Button>
			</Form>
		</div>
	);
}

const actionSchema = zfd.formData({
	code: zfd.text(z.string()),
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
	await assertSession(request, context);

	if (!context.twitter.enabled) {
		throw new Response(null, { status: 400 });
	}

	const data = actionSchema.parse(await request.formData());
	await context.twitter.inputConfirmationCode(data.code);
	throw redirect("/");
};
