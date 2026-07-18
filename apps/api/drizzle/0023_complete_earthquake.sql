CREATE TABLE "i18n_versions" (
	"locale" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ui_message_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"action" text NOT NULL,
	"edited_by" text,
	"edited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ui_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" text NOT NULL,
	"key" text NOT NULL,
	"draft_value" text,
	"published_value" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ui_messages_locale_key_uq" UNIQUE("locale","key")
);
--> statement-breakpoint
ALTER TABLE "ui_message_revisions" ADD CONSTRAINT "ui_message_revisions_message_id_ui_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ui_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ui_messages_locale_idx" ON "ui_messages" USING btree ("locale");