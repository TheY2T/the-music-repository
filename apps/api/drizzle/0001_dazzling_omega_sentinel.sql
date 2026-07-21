CREATE TABLE "media_objects" (
	"storage_key" text PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
