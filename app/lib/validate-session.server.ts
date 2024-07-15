import { prisma } from "./prisma.server.js";

export const validateSession = async (sessiontoken: string) => {
	const session = await prisma.session.findUnique({
		where: {
			token: sessiontoken,
		},
	});

	if (!session) {
		return;
	}

	return session;
};
