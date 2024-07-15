import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import { getStatus, inputConfirmationCode } from "../api/twitter.server";
import { Form } from "@remix-run/react";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { assertSession } from "../lib/session.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await assertSession(request);
	const status = await getStatus();
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

export const action = async ({ request }: ActionFunctionArgs) => {
	await assertSession(request);

	const data = actionSchema.parse(await request.formData());
	await inputConfirmationCode(data.code);
	throw redirect("/");
};
