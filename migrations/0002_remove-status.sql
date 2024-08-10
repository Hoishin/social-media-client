-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TwitterManageSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TwitterManageSession" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "TwitterManageSession";
DROP TABLE "TwitterManageSession";
ALTER TABLE "new_TwitterManageSession" RENAME TO "TwitterManageSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
