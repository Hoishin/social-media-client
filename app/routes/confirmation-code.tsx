import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import { getStatus, inputConfirmationCode } from "../api/twitter.server";
import { Form } from "@remix-run/react";
import { Button, TextField } from "@radix-ui/themes";
import { css } from "../../styled-system/css";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { assertSession } from "../session.server";

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
		<div className={css({ display: "grid", justifyContent: "center" })}>
			<Form method="post" className={css({ display: "grid", gap: "8px" })}>
				<label>
					Confirmation Code
					<TextField.Root name="code" />
				</label>
				<Button type="submit" className={css({ justifySelf: "end" })}>
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
