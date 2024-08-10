-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discordUsername" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tweets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tweetId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tweetedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BlueskyPosts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "postedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TwitterManageSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Tweets_tweetId_key" ON "Tweets"("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "BlueskyPosts_postId_key" ON "BlueskyPosts"("postId");
