-- AlterTable (String[] -> Json, so the same schema also works on sqlite)
ALTER TABLE "Exam" ALTER COLUMN "tags" DROP DEFAULT;
ALTER TABLE "Exam" ALTER COLUMN "tags" TYPE JSONB USING to_jsonb("tags");
ALTER TABLE "Exam" ALTER COLUMN "tags" SET DEFAULT '[]';
