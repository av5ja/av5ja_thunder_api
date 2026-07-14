-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start_time" TEXT,
    "end_time" TEXT,
    "mode" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "boss_id" INTEGER,
    "stage_id" INTEGER NOT NULL,
    "rare_weapons" TEXT NOT NULL,
    "weapon_list" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "idx_schedules_start_time" ON "schedules"("start_time" DESC);
