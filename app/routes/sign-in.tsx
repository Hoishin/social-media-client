import { type ActionFunctionArgs } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
	const { t } = useTranslation();
	return (
		<div className="grid place-items-center">
			<Form method="post">
				<Button type="submit">{t("signInWithDiscord")}</Button>
			</Form>
		</div>
	);
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
	return context.auth.authenticate("discord", request);
};
