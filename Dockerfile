FROM --platform=linux/amd64 node:20-slim AS base

RUN apt-get update && apt-get install -y openssl ffmpeg && rm -rf /var/lib/apt/lists/*


FROM base AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY prisma prisma
RUN npx prisma generate
COPY app app
COPY postcss.config.cjs tsconfig.json vite.config.ts ./
RUN npm run build


FROM base

RUN apt-get update && apt-get install -y \
	ca-certificates \
	fonts-liberation \
	libasound2 \
	libatk-bridge2.0-0 \
	libatk1.0-0 \
	libc6 \
	libcairo2 \
	libcups2 \
	libdbus-1-3 \
	libexpat1 \
	libfontconfig1 \
	libgbm1 \
	libgcc1 \
	libglib2.0-0 \
	libgtk-3-0 \
	libnspr4 \
	libnss3 \
	libpango-1.0-0 \
	libpangocairo-1.0-0 \
	libstdc++6 \
	libx11-6 \
	libx11-xcb1 \
	libxcb1 \
	libxcomposite1 \
	libxcursor1 \
	libxdamage1 \
	libxext6 \
	libxfixes3 \
	libxi6 \
	libxrandr2 \
	libxrender1 \
	libxss1 \
	libxtst6 \
	lsb-release \
	wget \
	xdg-utils \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/prisma prisma
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client node_modules/@prisma/client
COPY --from=build /app/build build

ENV NODE_ENV=production
ENV PUPPETEER_HEADLESS=true

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
